// @ts-nocheck We do not need the actual Deno import since it's used by supabase serverless functions so ignore
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async (req: Request) => {
  try {
    const { prompt } = await req.json();
    console.log('Question asked:', prompt);
    const model = Deno.env.get('GEMINI_MODEL') || 'gemini-2.0-flash';
    const preprompt = Deno.env.get('GEMINI_PREPROMPT') || '';
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generate embedding for user query (to search against stored document embeddings)
    const embeddingResponse = await fetch(
      'https://api.openai.com/v1/embeddings',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          // Have to match aws lambda embedding model
          model: 'text-embedding-ada-002',
          input: prompt,
        }),
      }
    );

    if (!embeddingResponse.ok) {
      throw new Error(
        `OpenAI embedding API error: ${embeddingResponse.statusText}`
      );
    }

    const embeddingData = await embeddingResponse.json();
    const queryEmbedding = embeddingData.data[0].embedding;

    // Search for similar chunks in database
    // Typical similarity thresholds (cosine similarity, range 0-1):
    // - 0.7: Strict (very similar only) - good for precise technical docs
    // - 0.6: Moderate-strict - good for general knowledge bases
    // - 0.5: Balanced (default) - good for most use cases, allows some flexibility
    // - 0.4: Permissive - finds more matches, may include less relevant results
    // - 0.3: Very permissive - use when you have few chunks or want to cast wide net
    // - 0.0 or negative: Returns all chunks ordered by similarity (no threshold filter)

    let { data: chunks, error: searchError } = await supabase.rpc(
      'match_chunks',
      {
        query_embedding: queryEmbedding,
        match_threshold: 0.3,
        match_count: 10,
      }
    );

    console.log(`Chunks received for "${prompt}":`, chunks?.length || 0);
    console.log(
      'RPC error:',
      searchError ? JSON.stringify(searchError) : 'none'
    );

    if (searchError) {
      console.error('RPC function error:', searchError);

      // Fallback: try with threshold 0.0
      const { data: fallbackChunks, error: fallbackError } = await supabase.rpc(
        'match_chunks',
        {
          query_embedding: queryEmbedding,
          match_threshold: 0.0,
          match_count: 10,
        }
      );
      console.log('Fallback chunks:', fallbackChunks?.length || 0);
      if (!fallbackError && fallbackChunks) {
        chunks = fallbackChunks;
      }
    }

    // Build context from retrieved chunks
    let contextText = '';
    const sourcesMap = new Map<
      number,
      {
        document_id: number;
        document_title: string;
        url: string;
      }
    >();

    console.log(`Final chunks count for "${prompt}":`, chunks?.length || 0);

    // S3 bucket configuration - update these with your actual values
    const s3BucketName = Deno.env.get('S3_BUCKET_NAME') || 'your-bucket-name';
    const s3Region = Deno.env.get('S3_REGION');

    if (chunks && chunks.length > 0) {
      chunks.forEach((chunk: any) => {
        const doc = chunk.knowledge_documents || {};
        contextText += `[Document: ${doc.title || 'Unknown'}]\n${chunk.chunk_text}\n\n`;

        // Deduplicate by document_id - only keep first occurrence
        if (!sourcesMap.has(chunk.document_id)) {
          const storagePath = doc.storage_path || '';
          // Construct public S3 URL: https://bucket-name.s3.region.amazonaws.com/path/to/file.pdf
          const s3Url = `https://${s3BucketName}.s3.${s3Region}.amazonaws.com/${storagePath}`;

          sourcesMap.set(chunk.document_id, {
            document_id: chunk.document_id,
            document_title: doc.title || 'Unknown',
            url: s3Url,
          });
        }
      });
    }

    // Convert Map to Array for response
    const sources = Array.from(sourcesMap.values());

    // Build prompt that uses provided context
    let systemInstruction = '';
    if (contextText) {
      systemInstruction = `You are a helpful assistant. Use the following context from the knowledge base to answer the user's question.

CONTEXT FROM KNOWLEDGE BASE:
${contextText}

USER QUESTION: ${prompt}

INSTRUCTIONS:
- Answer the question using the information from the context provided above
- Extract and use any relevant facts, numbers, ages, amounts, or details from the context
- You can make reasonable inferences and connections between pieces of information in the context to answer the question
- Synthesize information from multiple parts of the context if needed
- Be direct and helpful - use the information that is available in the context
- Only say "I don't have that information in my knowledge base at the moment" if the context above contains absolutely no relevant information at all
- If the context has related information, use it to provide an answer, even if you need to make a small logical connection

Answer the question:`;
    } else {
      systemInstruction = `The user asked: "${prompt}"\n\nRespond: "I don't have that information in my knowledge base at the moment."`;
    }

    const fullPrompt = preprompt
      ? `${preprompt}\n\n${systemInstruction}`
      : systemInstruction;

    // Call Gemini (same as gemini-proxy)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
          generationConfig: {
            maxOutputTokens: 500,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const geminiData = await response.json();

    // Extract answer from Gemini response
    let answer = 'Sorry, I could not generate a response.';
    if (geminiData.candidates && geminiData.candidates[0]) {
      const candidate = geminiData.candidates[0];
      if (
        candidate.content &&
        candidate.content.parts &&
        candidate.content.parts[0]
      ) {
        // Trim trailing whitespace/newlines from Gemini's response
        answer = candidate.content.parts[0].text.trim();
      }
    }

    // Return RAG response format
    return new Response(
      JSON.stringify({
        answer,
        sources: sources.length > 0 ? sources : undefined,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(
      JSON.stringify({ error: 'An unknown error occurred' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
