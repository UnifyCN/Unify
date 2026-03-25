// @ts-nocheck
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { fetchWithRetry } from '../_shared/fetchWithRetry.ts';
import { captureAiGeneration, computeGeminiCost } from '../_shared/posthogCapture.ts';

// ============================================================================
// CONSTANTS
// ============================================================================

const PERSONAS = ['international_student', 'skilled_worker', 'refugee', 'other'] as const;
const STAGES = ['0', '1', '2', '3', '4'] as const;
const BATCH_SIZE = 5;

const EMBEDDING_MODEL =
  Deno.env.get('OPENAI_EMBEDDING_MODEL') || 'text-embedding-3-small';

const STAGE_DESCRIPTIONS: Record<string, string> = {
  '0': 'pre-arrival or just arrived (0-1 months)',
  '1': 'settling in (1-3 months)',
  '2': 'building foundations (3-6 months)',
  '3': 'establishing roots (6-12 months)',
  '4': 'well-established (12+ months)',
};

const PERSONA_DESCRIPTIONS: Record<string, string> = {
  international_student: 'international student studying in Canada',
  skilled_worker: 'skilled worker who immigrated to Canada',
  refugee: 'refugee or protected person in Canada',
  other: 'newcomer to Canada',
};

// ============================================================================
// TIP GENERATION
// ============================================================================

interface GeneratedTip {
  category: string;
  title: string;
  description: string;
  tip_text: string;
}

const VALID_CATEGORIES = [
  'documents', 'finance', 'housing', 'employment',
  'healthcare', 'immigration', 'settlement', 'general',
];

function buildTopicQuery(persona: string, stage: string): string {
  const personaDesc = PERSONA_DESCRIPTIONS[persona] || 'newcomer to Canada';
  const stageDesc = STAGE_DESCRIPTIONS[stage] || 'newcomer';
  return `practical tips for ${personaDesc} who is ${stageDesc}`;
}

function buildGeminiPrompt(
  persona: string,
  stage: string,
  date: string,
  kbContext: string
): string {
  const personaDesc = PERSONA_DESCRIPTIONS[persona] || 'newcomer to Canada';
  const stageDesc = STAGE_DESCRIPTIONS[stage] || 'newcomer';

  return `You are generating a daily tip for newcomers to Canada.

USER PROFILE:
- Persona: ${personaDesc}
- Stage: ${stageDesc}
- Time context: ${date}

KNOWLEDGE BASE CONTEXT:
${kbContext || 'No specific knowledge base context available. Use your general knowledge about Canadian newcomer resources.'}

Generate a single, specific, actionable tip. Respond ONLY with valid JSON (no markdown, no code fences):
{
  "category": "documents|finance|housing|employment|healthcare|immigration|settlement|general",
  "title": "short title (max 60 chars)",
  "description": "one-line summary (max 80 chars)",
  "tip_text": "the full tip, specific and actionable (max 200 chars)"
}

RULES:
- Be specific to this persona and stage
- Reference real Canadian programs, services, or resources when possible
- No legal advice — use "generally" or "typically"
- No eligibility determinations
- Keep it actionable — tell them what to DO, not just what to know
- Vary the category day-to-day — do not always pick the same topic`;
}

function parseGeminiTipResponse(rawText: string): GeneratedTip | null {
  try {
    // Strip markdown code fences if present
    let cleaned = rawText.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
    }

    const parsed = JSON.parse(cleaned);

    if (!parsed.category || !parsed.title || !parsed.description || !parsed.tip_text) {
      console.error('Missing required fields in tip response');
      return null;
    }

    // Validate category
    const category = VALID_CATEGORIES.includes(parsed.category)
      ? parsed.category
      : 'general';

    return {
      category,
      title: String(parsed.title).slice(0, 60),
      description: String(parsed.description).slice(0, 80),
      tip_text: String(parsed.tip_text).slice(0, 200),
    };
  } catch (error) {
    console.error('Failed to parse tip JSON:', error, 'Raw:', rawText.slice(0, 300));
    return null;
  }
}

async function generateEmbedding(
  text: string,
  openaiApiKey: string
): Promise<number[] | null> {
  try {
    const response = await fetchWithRetry(
      'https://api.openai.com/v1/embeddings',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: EMBEDDING_MODEL,
          input: text,
        }),
      },
      { timeoutMs: 15000, retries: 2, retryDelayMs: 400 }
    );

    if (!response.ok) {
      console.error('OpenAI embedding error:', response.statusText);
      return null;
    }

    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error('Embedding generation failed:', error);
    return null;
  }
}

async function searchKnowledgeBase(
  supabase: ReturnType<typeof createClient>,
  embedding: number[]
): Promise<string> {
  try {
    const { data: chunks, error } = await supabase.rpc('match_chunks', {
      query_embedding: embedding,
      match_threshold: 0.3,
      match_count: 5,
    });

    if (error || !chunks || chunks.length === 0) {
      return '';
    }

    return chunks
      .map((chunk: any) => chunk.content)
      .join('\n\n')
      .slice(0, 3000); // Cap context size
  } catch (error) {
    console.error('KB search failed:', error);
    return '';
  }
}

async function callGemini(
  prompt: string,
  geminiApiKey: string,
  model: string
): Promise<{ text: string; usage: any } | null> {
  try {
    const response = await fetchWithRetry(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            maxOutputTokens: 300,
            temperature: 0.8,
          },
        }),
      },
      { timeoutMs: 20000, retries: 2, retryDelayMs: 500 }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) return null;

    return { text, usage: data.usageMetadata };
  } catch (error) {
    console.error('Gemini call failed:', error);
    return null;
  }
}

async function generateTipForCohort(
  supabase: ReturnType<typeof createClient>,
  persona: string,
  stage: string,
  date: string,
  openaiApiKey: string | null,
  geminiApiKey: string,
  model: string
): Promise<{ success: boolean; persona: string; stage: string }> {
  const cohortKey = `${persona}/${stage}`;

  // Step 1: Build topic query and get KB context
  let kbContext = '';
  if (openaiApiKey) {
    const topicQuery = buildTopicQuery(persona, stage);
    const embedding = await generateEmbedding(topicQuery, openaiApiKey);
    if (embedding) {
      kbContext = await searchKnowledgeBase(supabase, embedding);
    }
  }

  // Step 2: Generate tip via Gemini
  const prompt = buildGeminiPrompt(persona, stage, date, kbContext);
  const geminiResult = await callGemini(prompt, geminiApiKey, model);

  if (!geminiResult) {
    console.error(`[${cohortKey}] Gemini call failed`);
    return { success: false, persona, stage };
  }

  // Step 3: Parse response
  let tip = parseGeminiTipResponse(geminiResult.text);

  // Retry once on parse failure
  if (!tip) {
    console.warn(`[${cohortKey}] Parse failed, retrying once`);
    const retryResult = await callGemini(prompt, geminiApiKey, model);
    if (retryResult) {
      tip = parseGeminiTipResponse(retryResult.text);
    }
  }

  if (!tip) {
    console.error(`[${cohortKey}] Failed to generate valid tip after retry`);
    return { success: false, persona, stage };
  }

  // Step 4: Upsert into daily_tips
  const { error: upsertError } = await supabase
    .from('daily_tips')
    .upsert(
      {
        persona,
        stage,
        date,
        category: tip.category,
        title: tip.title,
        description: tip.description,
        tip_text: tip.tip_text,
        source_refs: kbContext ? [{ source: 'knowledge_base' }] : null,
      },
      { onConflict: 'persona,stage,date' }
    );

  if (upsertError) {
    console.error(`[${cohortKey}] DB upsert error:`, upsertError);
    return { success: false, persona, stage };
  }

  // Step 5: PostHog tracking
  if (geminiResult.usage) {
    const cost = computeGeminiCost(
      geminiResult.usage.promptTokenCount || 0,
      geminiResult.usage.candidatesTokenCount || 0,
      model
    );
    captureAiGeneration(`system:daily-tips:${cohortKey}`, {
      $ai_model: model,
      $ai_provider: 'google',
      $ai_input_tokens: geminiResult.usage.promptTokenCount || 0,
      $ai_output_tokens: geminiResult.usage.candidatesTokenCount || 0,
      $ai_total_tokens: geminiResult.usage.totalTokenCount || 0,
      $ai_input_cost_usd: cost.inputCost,
      $ai_output_cost_usd: cost.outputCost,
      $ai_total_cost_usd: cost.totalCost,
      feature: 'daily_tips',
      persona,
      stage,
      category: tip.category,
    });
  }

  console.log(`[${cohortKey}] Generated tip: "${tip.title}" (${tip.category})`);
  return { success: true, persona, stage };
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

Deno.serve(async (req: Request) => {
  const startTime = performance.now();

  try {
    // Auth: verify service role key
    const authHeader = req.headers.get('Authorization');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!authHeader || !authHeader.includes(serviceRoleKey)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEY not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY') || null;
    if (!openaiApiKey) {
      console.warn('OPENAI_API_KEY not set — generating tips without RAG grounding');
    }

    const model = Deno.env.get('GEMINI_MODEL') || 'gemini-2.5-flash';
    const today = new Date().toISOString().split('T')[0]; // UTC date

    // Build cohort matrix
    const cohorts: Array<{ persona: string; stage: string }> = [];
    for (const persona of PERSONAS) {
      for (const stage of STAGES) {
        cohorts.push({ persona, stage });
      }
    }

    console.log(`Generating ${cohorts.length} tips for date ${today}`);

    // Process in batches of BATCH_SIZE
    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < cohorts.length; i += BATCH_SIZE) {
      const batch = cohorts.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(
        batch.map(({ persona, stage }) =>
          generateTipForCohort(
            supabase,
            persona,
            stage,
            today,
            openaiApiKey,
            geminiApiKey,
            model
          )
        )
      );

      for (const result of results) {
        if (result.success) {
          successCount++;
        } else {
          failureCount++;
        }
      }
    }

    const totalTime = Math.round(performance.now() - startTime);
    const summary = {
      date: today,
      total: cohorts.length,
      success: successCount,
      failed: failureCount,
      duration_ms: totalTime,
    };

    console.log('Generation complete:', summary);

    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Fatal error in generate-daily-tips:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
