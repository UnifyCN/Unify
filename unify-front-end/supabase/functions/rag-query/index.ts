// @ts-nocheck We do not need the actual Deno import since it's used by supabase serverless functions so ignore
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

// ============================================================================
// CONSTANTS
// ============================================================================

// Standardized disclaimer for immigration-related responses
const STANDARD_DISCLAIMER =
  'This is general information, not legal advice. For decisions about your specific situation, please check the official IRCC website or talk to a licensed immigration professional.';

// Disclaimer for when KB doesn't have good matches
const NO_KB_HITS_DISCLAIMER =
  'This may not be covered in Unify\'s internal resources; please double-check with IRCC or a licensed immigration professional.';

// Query classification types
type QueryType = 'immigration' | 'newcomer_settlement' | 'general';

// ============================================================================
// CLASSIFIER FUNCTION
// ============================================================================

/**
 * Classifies the user query to determine routing.
 * Runs BEFORE embeddings/RAG to avoid unnecessary vector searches for general queries.
 */
async function classifyQuery(
  prompt: string,
  apiKey: string,
  model: string
): Promise<QueryType> {
  const classifierSystemMessage = `You are a classifier. Given a user question, respond with exactly one label: immigration, newcomer_settlement, or general. Do not explain, do not add text.

Examples:
- "How do I apply for a work permit?" → immigration
- "Where can I find ESL classes in Toronto?" → newcomer_settlement  
- "What's the weather like today?" → general
- "Am I eligible for PR?" → immigration
- "How do I open a bank account in Canada?" → newcomer_settlement
- "Tell me a joke" → general`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${classifierSystemMessage}\n\nUser question: ${prompt}` }],
            },
          ],
          generationConfig: {
            maxOutputTokens: 10,
            temperature: 0,
          },
        }),
      }
    );

    if (!response.ok) {
      console.error('Classifier API error:', response.statusText);
      return 'general'; // Fallback to general on error (safer)
    }

    const data = await response.json();
    const result = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toLowerCase();

    console.log('Classifier result:', result);

    if (result === 'immigration') return 'immigration';
    if (result === 'newcomer_settlement') return 'newcomer_settlement';
    return 'general';
  } catch (error) {
    console.error('Classifier error:', error);
    return 'general'; // Fallback to general on error (safer)
  }
}

// ============================================================================
// SYSTEM INSTRUCTIONS
// ============================================================================

/**
 * Build system instruction for immigration/newcomer queries WITH knowledge base context
 */
function buildImmigrationSystemInstruction(contextText: string): string {
  return `You are Unify's AI assistant, helping newcomers to Canada navigate immigration and settlement topics. You are friendly, supportive, and knowledgeable.

CONTEXT FROM KNOWLEDGE BASE:
${contextText}

RESPONSE FORMAT:
For immigration and newcomer questions, structure your response using these sections:

## Short Answer
A brief, direct answer to the question (1-2 sentences).

## Explanation
More detail and context about the topic. Use clear, newcomer-friendly language. Avoid jargon and explain any acronyms (e.g., "IRCC" = Immigration, Refugees and Citizenship Canada).

## What You Can Do Next
Actionable steps the user can take. Include relevant official links when appropriate (e.g., canada.ca/immigration, ircc.canada.ca).

## Important Notes
- Any caveats, deadlines, or things to watch out for
- Always include: "${STANDARD_DISCLAIMER}"

CRITICAL GUARDRAILS:
1. **NO LEGAL ADVICE**: Never make eligibility determinations or tell users definitively whether they qualify for something. Use phrases like "generally," "typically," or "you may be eligible if..."
2. **NO PERSONAL DECISIONS**: For questions like "Am I eligible for PR?", "Will I get approved?", or "Which visa should I apply for?" — explain the general criteria but DO NOT make the decision for them. Always recommend they verify with IRCC or consult a licensed immigration professional.
3. **OFFICIAL SOURCES**: Always recommend checking IRCC (ircc.canada.ca) or canada.ca for the most current information, as immigration rules change frequently.
4. **BE HELPFUL**: Use the knowledge base context to provide useful information. Make reasonable connections between pieces of information.
5. **CITE SOURCES**: Only include sources when your answer directly uses specific information from the knowledge base context.`;
}

/**
 * Build system instruction for immigration/newcomer queries WITHOUT knowledge base context
 */
function buildImmigrationNoKBInstruction(): string {
  return `You are Unify's AI assistant, helping newcomers to Canada navigate immigration and settlement topics. You are friendly, supportive, and knowledgeable.

RESPONSE FORMAT:
For immigration and newcomer questions, structure your response using these sections:

## Short Answer
A brief, direct answer to the question (1-2 sentences).

## Explanation
More detail and context about the topic. Use clear, newcomer-friendly language. Avoid jargon and explain any acronyms (e.g., "IRCC" = Immigration, Refugees and Citizenship Canada).

## What You Can Do Next
Actionable steps the user can take. Include relevant official links when appropriate (e.g., canada.ca/immigration, ircc.canada.ca).

## Important Notes
- Any caveats, deadlines, or things to watch out for
- Include: "${NO_KB_HITS_DISCLAIMER}"
- Include: "${STANDARD_DISCLAIMER}"

CRITICAL GUARDRAILS:
1. **NO LEGAL ADVICE**: Never make eligibility determinations or tell users definitively whether they qualify for something. Use phrases like "generally," "typically," or "you may be eligible if..."
2. **NO PERSONAL DECISIONS**: For questions like "Am I eligible for PR?", "Will I get approved?", or "Which visa should I apply for?" — explain the general criteria but DO NOT make the decision for them. Always recommend they verify with IRCC or consult a licensed immigration professional.
3. **OFFICIAL SOURCES**: Always recommend checking IRCC (ircc.canada.ca) or canada.ca for the most current information, as immigration rules change frequently.
4. **USE GENERAL KNOWLEDGE**: Answer using your general knowledge about Canadian immigration, but be clear that this information should be verified with official sources.`;
}

/**
 * Build system instruction for general (non-immigration) queries
 */
function buildGeneralSystemInstruction(): string {
  return `You are Unify's AI assistant. You are helpful, friendly, and conversational.

GUARDRAILS:
1. **NO PROFESSIONAL ADVICE**: Do not provide legal, medical, or financial advice. For such topics, recommend consulting appropriate professionals.
2. **BE HELPFUL**: Answer general questions helpfully and conversationally.
3. **STAY APPROPRIATE**: Keep responses appropriate and helpful.

If the user asks about Canadian immigration or newcomer topics, let them know you can help with those questions and encourage them to ask.`;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

Deno.serve(async (req: Request) => {
  try {
    const { prompt, conversationIdentifier, messages } = await req.json();
    console.log('Question asked:', prompt);
    console.log('Conversation identifier:', conversationIdentifier);
    console.log('Previous messages count:', messages?.length || 0);

    const model = Deno.env.get('GEMINI_MODEL') || 'gemini-2.0-flash';
    const preprompt = Deno.env.get('GEMINI_PREPROMPT') || '';
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ========================================================================
    // STEP 1: CLASSIFY THE QUERY (runs BEFORE embeddings to save costs)
    // ========================================================================
    const queryType = await classifyQuery(prompt, apiKey!, model);
    console.log('Query classified as:', queryType);

    const isImmigrationRelated = queryType === 'immigration' || queryType === 'newcomer_settlement';

    // ========================================================================
    // STEP 2: ROUTE BASED ON CLASSIFICATION
    // ========================================================================
    let contextText = '';
    let sources: Array<{ document_id: number; document_title: string; url: string }> = [];
    let hasGoodKBHits = false;
    let disclaimer: string | undefined;

    if (isImmigrationRelated) {
      // Immigration/newcomer query → Use RAG pipeline
      console.log('Routing to RAG pipeline for immigration/newcomer query');

      // Generate embedding for user query
      const embeddingResponse = await fetch(
        'https://api.openai.com/v1/embeddings',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${openaiApiKey}`,
          },
          body: JSON.stringify({
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
      // Similarity threshold: 0.3 is permissive to cast a wide net
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
      const sourcesMap = new Map<
        number,
        { document_id: number; document_title: string; url: string }
      >();

      console.log(`Final chunks count for "${prompt}":`, chunks?.length || 0);

      // S3 bucket configuration
      const s3BucketName = Deno.env.get('S3_BUCKET_NAME') || 'your-bucket-name';
      const s3Region = Deno.env.get('S3_REGION');

      // Check if we have good KB hits (chunks exist and have reasonable similarity)
      // "Without good KB hits" = no chunks returned OR similarity below useful threshold
      hasGoodKBHits = chunks && chunks.length > 0;

      if (hasGoodKBHits) {
        chunks.forEach((chunk: any) => {
          const doc = chunk.knowledge_documents || {};
          contextText += `[Document: ${doc.title || 'Unknown'}]\n${chunk.chunk_text}\n\n`;

          // Deduplicate by document_id
          if (!sourcesMap.has(chunk.document_id)) {
            const storagePath = doc.storage_path || '';
            const s3Url = `https://${s3BucketName}.s3.${s3Region}.amazonaws.com/${storagePath}`;

            sourcesMap.set(chunk.document_id, {
              document_id: chunk.document_id,
              document_title: doc.title || 'Unknown',
              url: s3Url,
            });
          }
        });

        sources = Array.from(sourcesMap.values());
        disclaimer = STANDARD_DISCLAIMER;
      } else {
        // No good KB hits - still answer but with appropriate disclaimer
        disclaimer = `${NO_KB_HITS_DISCLAIMER} ${STANDARD_DISCLAIMER}`;
      }
    } else {
      // General query → Skip RAG, use direct Gemini
      console.log('Routing to general response (no RAG) for general query');
    }

    // ========================================================================
    // STEP 3: BUILD CONVERSATION HISTORY
    // ========================================================================
    const recentMessages =
      messages && Array.isArray(messages)
        ? messages.slice(-10)
        : [];

    const conversationHistory = recentMessages.map(
      (msg: { message: string; role: 'user' | 'assistant' }) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.message }],
      })
    );

    // ========================================================================
    // STEP 4: BUILD SYSTEM INSTRUCTION BASED ON ROUTE
    // ========================================================================
    let systemInstruction = '';

    if (isImmigrationRelated) {
      if (hasGoodKBHits && contextText) {
        systemInstruction = buildImmigrationSystemInstruction(contextText);
      } else {
        systemInstruction = buildImmigrationNoKBInstruction();
      }
    } else {
      systemInstruction = buildGeneralSystemInstruction();
    }

    // Add preprompt if available (preserving existing behavior)
    const fullSystemInstruction = preprompt
      ? `${preprompt}\n\n${systemInstruction}`
      : systemInstruction;

    // ========================================================================
    // STEP 5: BUILD REQUEST AND CALL GEMINI
    // ========================================================================
    const contents = [];
    contents.push(...conversationHistory);

    // Prepend system instruction to the current prompt
    const currentPrompt = `${fullSystemInstruction}\n\nUser question: ${prompt}`;
    contents.push({
      role: 'user',
      parts: [{ text: currentPrompt }],
    });

    // Increase max tokens for structured responses
    const requestBody = {
      contents: contents,
      generationConfig: {
        maxOutputTokens: 1000, // Increased for structured format
      },
    };

    console.log('Gemini API Request Details:');
    console.log('- Model:', model);
    console.log('- Query type:', queryType);
    console.log('- Has good KB hits:', hasGoodKBHits);
    console.log('- Conversation history length:', conversationHistory.length);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error details:');
      console.error('- Status:', response.status);
      console.error('- Status Text:', response.statusText);
      console.error('- Error response:', errorText);
      throw new Error(
        `Gemini API error: ${response.statusText} - ${errorText}`
      );
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
        answer = candidate.content.parts[0].text.trim();
      }
    }

    // ========================================================================
    // STEP 6: RETURN RESPONSE
    // ========================================================================
    return new Response(
      JSON.stringify({
        answer,
        sources: sources.length > 0 ? sources : undefined,
        queryType,
        disclaimer,
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
