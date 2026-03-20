// @ts-nocheck
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { fetchWithRetry } from '../_shared/fetchWithRetry.ts';

// ============================================================================
// CONSTANTS
// ============================================================================

const EMBEDDING_MODEL =
  Deno.env.get('OPENAI_EMBEDDING_MODEL') || 'text-embedding-3-small';

// Chunking config
const CHUNK_TARGET_TOKENS = 500;
const CHUNK_OVERLAP_TOKENS = 50;
const APPROX_CHARS_PER_TOKEN = 4;
const CHUNK_TARGET_CHARS = CHUNK_TARGET_TOKENS * APPROX_CHARS_PER_TOKEN;
const CHUNK_OVERLAP_CHARS = CHUNK_OVERLAP_TOKENS * APPROX_CHARS_PER_TOKEN;

// Quality thresholds
const MIN_CHUNK_WORDS = 30;
const MAX_CHUNK_WORDS = 1500;

// Common boilerplate patterns found on gov sites
const BOILERPLATE_PATTERNS: RegExp[] = [
  /^skip to (main )?content$/i,
  /^(primary|secondary) (menu|navigation)$/i,
  /^(date modified|last updated):\s/i,
  /^report a problem/i,
  /^share this page/i,
  /^is there anything wrong/i,
  /^thank you for your help/i,
  /^government of canada$/i,
  /^breadcrumb$/i,
];

// ============================================================================
// HTML → CLEAN TEXT
// ============================================================================

/**
 * Strips HTML tags, scripts, styles, nav elements, and normalizes whitespace.
 * Optimized for government websites (canada.ca, IRCC).
 */
function htmlToCleanText(html: string): string {
  let text = html;

  // Remove script and style blocks entirely
  text = text.replace(/<script[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[\s\S]*?<\/style>/gi, '');
  text = text.replace(/<noscript[\s\S]*?<\/noscript>/gi, '');

  // Remove nav, header, footer elements (common site chrome)
  text = text.replace(/<nav[\s\S]*?<\/nav>/gi, '');
  text = text.replace(/<header[\s\S]*?<\/header>/gi, '');
  text = text.replace(/<footer[\s\S]*?<\/footer>/gi, '');

  // Remove HTML comments
  text = text.replace(/<!--[\s\S]*?-->/g, '');

  // Convert common block elements to newlines for structure
  text = text.replace(/<\/?(p|div|br|h[1-6]|li|tr|td|th|blockquote|section|article)[^>]*>/gi, '\n');

  // Remove all remaining HTML tags
  text = text.replace(/<[^>]+>/g, '');

  // Decode common HTML entities
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&#x([0-9a-fA-F]+);/g, (_, value: string) =>
    String.fromCharCode(parseInt(value, 16))
  );
  text = text.replace(/&#(\d+);/g, (_, value: string) =>
    String.fromCharCode(parseInt(value, 10))
  );

  // Normalize whitespace: collapse multiple spaces/tabs, trim lines
  text = text
    .split('\n')
    .map(line => line.replace(/\s+/g, ' ').trim())
    .filter(line => line.length > 0)
    .join('\n');

  // Collapse multiple blank lines
  text = text.replace(/\n{3,}/g, '\n\n');

  return text.trim();
}

// ============================================================================
// CHUNKING
// ============================================================================

/**
 * Splits text into overlapping chunks of ~CHUNK_TARGET_CHARS characters.
 * Tries to split at paragraph boundaries, falling back to sentence boundaries.
 */
function chunkText(text: string): string[] {
  if (text.length <= CHUNK_TARGET_CHARS) {
    return [text];
  }

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = Math.min(start + CHUNK_TARGET_CHARS, text.length);

    // If not at the end, try to find a good split point
    if (end < text.length) {
      // Try paragraph break first
      const paragraphBreak = text.lastIndexOf('\n\n', end);
      if (paragraphBreak > start + CHUNK_TARGET_CHARS * 0.3) {
        end = paragraphBreak;
      } else {
        // Try sentence break
        const sentenceBreak = text.lastIndexOf('. ', end);
        if (sentenceBreak > start + CHUNK_TARGET_CHARS * 0.3) {
          end = sentenceBreak + 1; // Include the period
        }
        // Otherwise just cut at the target length
      }
    }

    chunks.push(text.slice(start, end).trim());

    // Move start with overlap
    const nextStart = Math.max(0, end - CHUNK_OVERLAP_CHARS);
    start = nextStart <= start ? end : nextStart;
  }

  return chunks.filter(c => c.length > 0);
}

// ============================================================================
// QUALITY SCORING
// ============================================================================

/**
 * Returns true if a chunk passes quality checks.
 * Filters out boilerplate, too-short, and too-long chunks.
 */
function isQualityChunk(text: string): boolean {
  const wordCount = text.split(/\s+/).length;

  // Too short — likely a nav fragment or heading
  if (wordCount < MIN_CHUNK_WORDS) return false;

  // Too long — should have been split further
  if (wordCount > MAX_CHUNK_WORDS) return false;

  // Check for boilerplate patterns
  const firstLine = text.split('\n')[0].trim();
  if (BOILERPLATE_PATTERNS.some(pattern => pattern.test(firstLine))) {
    return false;
  }

  return true;
}

// ============================================================================
// CONTENT HASHING
// ============================================================================

async function computeContentHash(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ============================================================================
// EMBEDDING
// ============================================================================

async function generateEmbeddings(
  texts: string[],
  apiKey: string
): Promise<number[][]> {
  const response = await fetchWithRetry(
    'https://api.openai.com/v1/embeddings',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: texts,
      }),
    },
    { timeoutMs: 30000, retries: 2, retryDelayMs: 500 }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI embedding error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return data.data.map((d: { embedding: number[] }) => d.embedding);
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

Deno.serve(async (req: Request) => {
  const startTime = performance.now();
  let capturedUrl: string | null = null;
  let capturedCrawlSourceId: number | string | null = null;

  try {
    const body = await req.json();
    const url = typeof body?.url === 'string' ? body.url : '';
    const crawl_source_id = body?.crawl_source_id ?? null;
    capturedUrl = url || null;
    capturedCrawlSourceId =
      typeof crawl_source_id === 'number' || typeof crawl_source_id === 'string'
        ? crawl_source_id
        : null;

    if (!url || typeof url !== 'string') {
      return new Response(JSON.stringify({ error: 'url is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('Missing OPENAI_API_KEY');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ========================================================================
    // STEP 1: FETCH THE URL
    // ========================================================================
    console.log(`Fetching: ${url}`);

    let html: string;
    try {
      const fetchResponse = await fetchWithRetry(
        url,
        {
          method: 'GET',
          headers: {
            'User-Agent':
              'UnifyBot/1.0 (+https://unifysocial.ca; educational-knowledge-indexer)',
          },
        },
        { timeoutMs: 15000, retries: 2, retryDelayMs: 500 }
      );

      if (!fetchResponse.ok) {
        throw new Error(`HTTP ${fetchResponse.status}: ${fetchResponse.statusText}`);
      }

      html = await fetchResponse.text();
    } catch (fetchError) {
      const errorMsg =
        fetchError instanceof Error ? fetchError.message : 'Fetch failed';
      console.error(`Fetch failed for ${url}: ${errorMsg}`);

      // Log failure
      await supabase.from('crawl_logs').insert({
        crawl_source_id: crawl_source_id || null,
        url,
        status: 'error',
        error_message: errorMsg,
        duration_ms: Math.round(performance.now() - startTime),
      });

      return new Response(
        JSON.stringify({ error: errorMsg, status: 'error' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ========================================================================
    // STEP 2: HTML → CLEAN TEXT
    // ========================================================================
    const cleanText = htmlToCleanText(html);

    if (cleanText.length < 100) {
      console.warn(`Empty or minimal content from ${url}`);

      await supabase.from('crawl_logs').insert({
        crawl_source_id: crawl_source_id || null,
        url,
        status: 'error',
        error_message: 'Empty or minimal content after HTML parsing',
        duration_ms: Math.round(performance.now() - startTime),
      });

      return new Response(
        JSON.stringify({ status: 'error', reason: 'empty_content' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ========================================================================
    // STEP 3: CONTENT HASH — SKIP IF UNCHANGED
    // ========================================================================
    const contentHash = await computeContentHash(cleanText);

    // Check if we already have this exact content
    const { data: existingDoc } = await supabase
      .from('knowledge_documents')
      .select('id, content_hash')
      .eq('source_url', url)
      .maybeSingle();

    if (existingDoc?.content_hash === contentHash) {
      console.log(`No changes detected for ${url} (hash match)`);

      // Update last_crawled_at on the source
      if (crawl_source_id) {
        await supabase
          .from('crawl_sources')
          .update({ last_crawled_at: new Date().toISOString() })
          .eq('id', crawl_source_id);
      }

      await supabase.from('crawl_logs').insert({
        crawl_source_id: crawl_source_id || null,
        url,
        status: 'skipped',
        content_changed: false,
        duration_ms: Math.round(performance.now() - startTime),
      });

      return new Response(
        JSON.stringify({ status: 'skipped', reason: 'no_changes' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ========================================================================
    // STEP 4: CHUNK TEXT
    // ========================================================================
    const rawChunks = chunkText(cleanText);
    const qualityChunks = rawChunks.filter(isQualityChunk);

    console.log(
      `Chunked: ${rawChunks.length} raw → ${qualityChunks.length} quality chunks`
    );

    if (qualityChunks.length === 0) {
      console.warn(`No quality chunks from ${url}`);

      await supabase.from('crawl_logs').insert({
        crawl_source_id: crawl_source_id || null,
        url,
        status: 'error',
        error_message: `No quality chunks (${rawChunks.length} raw chunks all filtered)`,
        duration_ms: Math.round(performance.now() - startTime),
      });

      return new Response(
        JSON.stringify({ status: 'error', reason: 'no_quality_chunks' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ========================================================================
    // STEP 5: GENERATE EMBEDDINGS
    // ========================================================================
    console.log(`Generating embeddings for ${qualityChunks.length} chunks...`);

    // Batch embeddings (OpenAI supports up to 2048 inputs per call)
    const EMBEDDING_BATCH_SIZE = 50;
    const allEmbeddings: number[][] = [];

    for (let i = 0; i < qualityChunks.length; i += EMBEDDING_BATCH_SIZE) {
      const batch = qualityChunks.slice(i, i + EMBEDDING_BATCH_SIZE);
      const batchEmbeddings = await generateEmbeddings(batch, openaiApiKey);
      allEmbeddings.push(...batchEmbeddings);
    }

    // ========================================================================
    // STEP 6: WRITE-THEN-SWAP — UPSERT DOCUMENT + CHUNKS
    // ========================================================================
    const now = new Date().toISOString();

    // Extract a title from the URL or first line of content
    const titleFromContent = cleanText.split('\n')[0].slice(0, 200);
    const title = titleFromContent || url.split('/').pop() || url;

    // Determine word count
    const wordCount = cleanText.split(/\s+/).length;

    // Upsert the document record
    let documentId: number;

    if (existingDoc) {
      // Update existing document
      const { error: updateError } = await supabase
        .from('knowledge_documents')
        .update({
          title,
          content_hash: contentHash,
          source_url: url,
          updated_at: now,
          metadata: {
            word_count: wordCount,
            chunk_count: qualityChunks.length,
            source: 'crawler',
          },
        })
        .eq('id', existingDoc.id);

      if (updateError) {
        throw new Error(`Document update failed: ${updateError.message}`);
      }

      documentId = existingDoc.id;
    } else {
      // Insert new document
      const { data: newDoc, error: insertError } = await supabase
        .from('knowledge_documents')
        .insert({
          title,
          storage_path: '',
          content_hash: contentHash,
          source_url: url,
          updated_at: now,
          metadata: {
            word_count: wordCount,
            chunk_count: qualityChunks.length,
            source: 'crawler',
          },
        })
        .select('id')
        .single();

      if (insertError || !newDoc) {
        throw new Error(
          `Document insert failed: ${insertError?.message || 'No data returned'}`
        );
      }

      documentId = newDoc.id;
    }

    // Insert new chunks
    const chunkRows = qualityChunks.map((text, index) => ({
      document_id: documentId,
      chunk_index: index,
      chunk_text: text,
      embedding: allEmbeddings[index],
      updated_at: now,
      metadata: { source: 'crawler' },
    }));

    const { error: chunkInsertError } = await supabase
      .from('knowledge_chunks')
      .insert(chunkRows);

    if (chunkInsertError) {
      throw new Error(`Chunk insert failed: ${chunkInsertError.message}`);
    }

    // Delete old chunks only AFTER new ones are successfully written
    if (existingDoc) {
      const { error: deleteError } = await supabase
        .from('knowledge_chunks')
        .delete()
        .eq('document_id', documentId)
        .lt('updated_at', now);

      if (deleteError) {
        console.error(
          `Warning: old chunk cleanup failed: ${deleteError.message}`
        );
        // Non-fatal — old chunks remain but new ones are already in place
      }
    }

    // ========================================================================
    // STEP 7: UPDATE CRAWL SOURCE + LOG SUCCESS
    // ========================================================================
    if (crawl_source_id) {
      await supabase
        .from('crawl_sources')
        .update({ last_crawled_at: now })
        .eq('id', crawl_source_id);
    }

    const durationMs = Math.round(performance.now() - startTime);

    await supabase.from('crawl_logs').insert({
      crawl_source_id: crawl_source_id || null,
      url,
      status: 'success',
      content_changed: true,
      chunks_created: qualityChunks.length,
      duration_ms: durationMs,
    });

    console.log(
      `Success: ${url} → ${qualityChunks.length} chunks in ${durationMs}ms`
    );

    return new Response(
      JSON.stringify({
        status: 'success',
        document_id: documentId,
        chunks_created: qualityChunks.length,
        content_changed: true,
        duration_ms: durationMs,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const errorMsg =
      error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Ingest error:', errorMsg);

    // Try to log the error
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        await supabase.from('crawl_logs').insert({
          crawl_source_id: capturedCrawlSourceId || null,
          url: capturedUrl || 'unknown',
          status: 'error',
          error_message: errorMsg,
          duration_ms: Math.round(performance.now() - startTime || 0),
        });
      }
    } catch {
      // Best-effort logging
    }

    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
