// @ts-nocheck We do not need the actual Deno import since it's used by supabase serverless functions so ignore
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async (req: Request) => {
  try {
    const { prompt } = await req.json();
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
          model: 'text-embedding-3-small',
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

    // First, check if any chunks exist in database
    const { count: totalChunks } = await supabase
      .from('knowledge_chunks')
      .select('*', { count: 'exact', head: true });
    console.log('Total chunks in database:', totalChunks);

    // Search for similar chunks in database
    // Typical similarity thresholds (cosine similarity, range 0-1):
    // - 0.7: Strict (very similar only) - good for precise technical docs
    // - 0.6: Moderate-strict - good for general knowledge bases
    // - 0.5: Balanced (default) - good for most use cases, allows some flexibility
    // - 0.4: Permissive - finds more matches, may include less relevant results
    // - 0.3: Very permissive - use when you have few chunks or want to cast wide net
    const { data: chunks, error: searchError } = await supabase.rpc(
      'match_chunks',
      {
        query_embedding: queryEmbedding,
        match_threshold: 0.5, // Balanced threshold - works well for most RAG applications
        match_count: 5,
      }
    );

    // Log results for debugging
    if (searchError) {
      console.error('RPC function error:', searchError);
      console.error('Error details:', JSON.stringify(searchError, null, 2));
    }

    // Check if chunks have embeddings
    const { data: sampleChunks } = await supabase
      .from('knowledge_chunks')
      .select('id, chunk_text, embedding')
      .limit(1);
    if (sampleChunks && sampleChunks.length > 0) {
      console.log(
        'Sample chunk has embedding:',
        sampleChunks[0].embedding ? 'YES' : 'NO'
      );
      console.log('Sample chunk ID:', sampleChunks[0].id);
      console.log('Query embedding length:', queryEmbedding?.length);
    }

    console.log('Found matching chunks:', chunks?.length || 0);
    if (!chunks || chunks.length === 0) {
      console.log('No matching chunks found for query:', prompt);
      console.log('Trying with threshold 0.0 instead...');
      // Try with 0.0 threshold as fallback test
      const { data: testChunks } = await supabase.rpc('match_chunks', {
        query_embedding: queryEmbedding,
        match_threshold: 0.0,
        match_count: 5,
      });
      console.log('Test chunks with 0.0 threshold:', testChunks?.length || 0);
    } else {
      console.log('First chunk similarity:', chunks[0]?.similarity);
      console.log(
        'First chunk preview:',
        chunks[0]?.chunk_text?.substring(0, 100)
      );
    }

    // Build context from retrieved chunks
    let contextText = '';
    const sources: Array<{
      document_id: number;
      document_title: string;
      chunk_text: string;
      chunk_index: number;
    }> = [];

    if (chunks && chunks.length > 0) {
      chunks.forEach((chunk: any) => {
        const doc = chunk.knowledge_documents || {};
        contextText += `[Document: ${doc.title || 'Unknown'}]\n${chunk.chunk_text}\n\n`;
        sources.push({
          document_id: chunk.document_id,
          document_title: doc.title || 'Unknown',
          chunk_text: chunk.chunk_text,
          chunk_index: chunk.chunk_index,
        });
      });
    }

    // Build strict prompt that only uses provided context
    let systemInstruction = '';
    if (contextText) {
      systemInstruction = `You are a helpful assistant. You MUST answer the user's question using ONLY the information provided in the context below. 

IMPORTANT RULES:
- ONLY use information from the provided context
- If the answer is not in the context, say a friendly variation of: "I don't have that information in my knowledge base at the moment."
- Do NOT use any information from your training data
- Do NOT make up information

Context from knowledge base:
${contextText}

User question: ${prompt}

Remember: Only answer if the information is in the context above. Otherwise, say you don't have that information.`;
    } else {
      systemInstruction = `The user asked: "${prompt}"\n\nRespond concisely: "I don't have that information in my knowledge base at the moment."`;
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
        answer = candidate.content.parts[0].text;
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
