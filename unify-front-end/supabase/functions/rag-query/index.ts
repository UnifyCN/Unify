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
  "This may not be covered in Unify's internal resources; please double-check with IRCC or a licensed immigration professional.";

// Query classification types - expanded with special modes
type QueryType =
  | 'immigration'
  | 'newcomer_settlement'
  | 'general'
  | 'fact_check'
  | 'form_help';

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
  const classifierSystemMessage = `You are a classifier. Given a user question, respond with exactly one label: immigration, newcomer_settlement, general, fact_check, or form_help. Do not explain, do not add text.

Labels:
- immigration: Questions about visas, work permits, PR, citizenship, IRCC processes
- newcomer_settlement: Questions about settling in Canada (banking, TFSA, RRSP, credit, jobs, SIN, EI, housing, ESL)
- fact_check: User wants to verify a rumor or claim they heard (contains phrases like "I heard that", "Is it true that", "Can you verify", "myth", "rumor")
- form_help: User needs help understanding or filling out an immigration form (IMM forms, specific form fields)
- general: Everything else (jokes, weather, unrelated topics)

Examples:
- "How do I apply for a work permit?" → immigration
- "Where can I find ESL classes in Toronto?" → newcomer_settlement  
- "What's the weather like today?" → general
- "Am I eligible for PR?" → immigration
- "How do I open a bank account in Canada?" → newcomer_settlement
- "What's a TFSA?" → newcomer_settlement
- "How does RRSP work?" → newcomer_settlement
- "How do I build credit in Canada?" → newcomer_settlement
- "What is EI?" → newcomer_settlement
- "How do I find a job in Canada?" → newcomer_settlement
- "How do I get a SIN number?" → newcomer_settlement
- "I heard that international students can work 40 hours now" → fact_check
- "Is it true that PR holders can sponsor parents?" → fact_check
- "Can you verify if PGWP is being extended?" → fact_check
- "Help me fill out IMM5710" → form_help
- "What does field 4a on IMM5257 mean?" → form_help
- "I need help with my study permit application form" → form_help
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
              parts: [
                {
                  text: `${classifierSystemMessage}\n\nUser question: ${prompt}`,
                },
              ],
            },
          ],
          generationConfig: {
            maxOutputTokens: 15,
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
    const result = data.candidates?.[0]?.content?.parts?.[0]?.text
      ?.trim()
      .toLowerCase();

    console.log('Classifier result:', result);

    if (result === 'immigration') return 'immigration';
    if (result === 'newcomer_settlement') return 'newcomer_settlement';
    if (result === 'fact_check') return 'fact_check';
    if (result === 'form_help') return 'form_help';
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
 * Common footer for generating suggested next steps
 */
const SUGGESTIONS_INSTRUCTION = `

SUGGESTED NEXT STEPS:
At the very end of your response, suggest 2-3 brief follow-up questions the user might want to ask next. These should be natural continuations of the conversation.
Format them on a new line starting with "[SUGGESTIONS]:" followed by the questions separated by "|".
Example: [SUGGESTIONS]: How do I open a TFSA? | What's the contribution limit? | Can I withdraw anytime?`;

/**
 * Build system instruction for immigration/newcomer queries WITH knowledge base context
 */
function buildImmigrationSystemInstruction(contextText: string): string {
  return `You are Unify's AI assistant, helping newcomers to Canada navigate immigration and settlement topics. You are friendly, supportive, and knowledgeable.

CRITICAL - YOU HAVE ACCESS TO:
1. The FULL conversation history with this user (all previous messages in this chat)
2. The user's personal profile including their situation in Canada, goals, and interests
3. Knowledge base articles about Canadian immigration

You MUST use this information when answering. If relevant, include details of the user's personal profile while answering.

CONTEXT FROM KNOWLEDGE BASE:
${contextText}

CRITICAL: BREVITY IS KEY
Users are on mobile. Keep responses short and scannable. Avoid walls of text. Each section should be 2-3 sentences MAX. Get to the point quickly.

RESPONSE FORMAT:
Structure your response using these sections:

## Short Answer
1-2 sentences MAX. Direct answer only.

## Explanation
2-3 sentences of essential context. Only include what the user truly needs to know. Use simple, newcomer-friendly language. Explain acronyms briefly (e.g., "TFSA" = Tax-Free Savings Account).

## What You Can Do Next
One actionable step OR one follow-up question like "Would you like me to explain how to open one?" Keep it to 1-2 lines.

## Important Notes
One key caveat only: "${STANDARD_DISCLAIMER}"

CRITICAL GUARDRAILS:
1. **NO LEGAL ADVICE**: Never make eligibility determinations. Use "generally," "typically," or "you may be eligible if..."
2. **NO PERSONAL DECISIONS**: For questions like "Am I eligible?" — explain general criteria but recommend they verify with IRCC or a licensed professional.
3. **OFFICIAL SOURCES**: Recommend IRCC (ircc.canada.ca) for current information.
4. **CITE SOURCES**: Only include sources when directly using knowledge base information.${SUGGESTIONS_INSTRUCTION}`;
}

/**
 * Build system instruction for immigration/newcomer queries WITHOUT knowledge base context
 */
function buildImmigrationNoKBInstruction(): string {
  return `You are Unify's AI assistant, helping newcomers to Canada navigate immigration and settlement topics. You are friendly, supportive, and knowledgeable.

CRITICAL - YOU HAVE ACCESS TO:
1. The FULL conversation history with this user (all previous messages in this chat)
2. The user's personal profile including their situation in Canada, goals, and interests

You MUST use this information when answering. If relevant, include details of the user's personal profile while answering.

CRITICAL: BREVITY IS KEY
Users are on mobile. Keep responses short and scannable. Avoid walls of text. Each section should be 2-3 sentences MAX. Get to the point quickly.

RESPONSE FORMAT:
Structure your response using these sections:

## Short Answer
1-2 sentences MAX. Direct answer only.

## Explanation
2-3 sentences of essential context. Only include what the user truly needs to know. Use simple, newcomer-friendly language. Explain acronyms briefly.

## What You Can Do Next
One actionable step OR one follow-up question like "Would you like me to explain more?" Keep it to 1-2 lines.

## Important Notes
"${NO_KB_HITS_DISCLAIMER}" "${STANDARD_DISCLAIMER}"

CRITICAL GUARDRAILS:
1. **NO LEGAL ADVICE**: Never make eligibility determinations. Use "generally," "typically," or "you may be eligible if..."
2. **NO PERSONAL DECISIONS**: For questions like "Am I eligible?" — explain general criteria but recommend they verify with IRCC or a licensed professional.
3. **OFFICIAL SOURCES**: Recommend IRCC (ircc.canada.ca) for current information.
4. **USE GENERAL KNOWLEDGE**: Answer using general knowledge but note it should be verified with official sources.${SUGGESTIONS_INSTRUCTION}`;
}

/**
 * Build system instruction for FACT CHECK mode - myth-busting
 */
function buildFactCheckInstruction(contextText: string): string {
  const kbContext = contextText
    ? `\nKNOWLEDGE BASE CONTEXT:\n${contextText}\n`
    : '';

  return `You are Unify's AI assistant in FACT CHECK mode. The user wants to verify a claim or rumor they heard about Canadian immigration or settlement.

IMPORTANT: You have access to the user's conversation history and their personal profile information. USE this context when relevant.

${kbContext}
CRITICAL: BE RIGOROUS AND CITE SOURCES
Your job is to verify claims against official government information. Be extra careful and accurate.

RESPONSE FORMAT:

## Verdict
Start with one of these verdicts in bold:
- **✅ VERIFIED** - The claim is accurate based on current official information
- **❌ FALSE** - The claim is incorrect or outdated
- **⚠️ PARTIALLY TRUE** - The claim has some truth but is misleading or incomplete
- **❓ UNVERIFIED** - Cannot confirm with available information

## The Facts
2-3 sentences explaining what the official rules actually are. Cite official sources (IRCC, canada.ca).

## Important Context
1-2 sentences on any nuances, recent changes, or exceptions. Immigration rules change frequently - note when information might be time-sensitive.

## Official Source
Always provide a link to verify: "Check the official IRCC website: ircc.canada.ca"

CRITICAL GUARDRAILS:
1. If unsure, say so. Never guess on immigration matters.
2. Always recommend checking official sources for the most current information.
3. Note if rules have changed recently or are expected to change.${SUGGESTIONS_INSTRUCTION}`;
}

/**
 * Build system instruction for FORM HELP mode - educational form guidance
 */
function buildFormHelpInstruction(contextText: string): string {
  const kbContext = contextText
    ? `\nKNOWLEDGE BASE CONTEXT:\n${contextText}\n`
    : '';

  return `You are Unify's AI assistant in FORM HELP mode. The user needs help understanding an immigration form.

IMPORTANT: You have access to the user's conversation history and their personal profile information. USE this context to provide personalized guidance.

${kbContext}
CRITICAL: EDUCATIONAL ONLY - NEVER TELL THEM WHAT TO WRITE
Your job is to EXPLAIN what questions mean and what information is being asked for. You are NOT providing legal advice or telling them how to answer.

RESPONSE FORMAT:

## Which Form?
If not specified, ask: "Which form are you working on? (e.g., IMM5710, IMM5257, IMM1294)"

## Field Explanation
Explain what the field/question is asking for in simple terms. Use examples of the TYPE of information needed, not specific answers.

Example: "This field asks for your travel history - list all countries you've visited in the past 10 years, including short trips."

## Tips
1-2 practical tips for filling out this section accurately.

## ⚠️ Important Disclaimer
"This is educational guidance to help you understand what's being asked. For legal advice on how to answer specific questions about YOUR situation, please consult a licensed immigration consultant or lawyer."

NEVER DO:
- Tell them what to write in a field
- Make decisions about their eligibility
- Advise them to omit or include specific information
- Provide legal interpretations of their situation${SUGGESTIONS_INSTRUCTION}`;
}

/**
 * Build system instruction for general (non-immigration) queries
 */
function buildGeneralSystemInstruction(): string {
  return `You are Unify's AI assistant. You are helpful, friendly, and conversational.

CRITICAL - YOU HAVE ACCESS TO:
1. The FULL conversation history with this user (all previous messages)
2. The user's personal profile information

You MUST use this information when answering. If relevant, include details of the user's personal profile while answering.

GUARDRAILS:
1. **NO PROFESSIONAL ADVICE**: Do not provide legal, medical, or financial advice. For such topics, recommend consulting appropriate professionals.
2. **BE HELPFUL**: Answer general questions helpfully and conversationally.
3. **STAY APPROPRIATE**: Keep responses appropriate and helpful.

If the user asks about Canadian immigration or newcomer topics, let them know you can help with those questions and encourage them to ask.${SUGGESTIONS_INSTRUCTION}`;
}

/**
 * Parse suggested next steps from the AI response
 */
function parseSuggestionsFromResponse(answer: string): {
  cleanAnswer: string;
  suggestions: string[];
} {
  const suggestionsMatch = answer.match(/\[SUGGESTIONS\]:\s*(.+)$/im);

  if (suggestionsMatch) {
    const suggestionsText = suggestionsMatch[1].trim();
    const suggestions = suggestionsText
      .split('|')
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .slice(0, 3); // Max 3 suggestions

    // Remove the suggestions line from the answer
    const cleanAnswer = answer.replace(/\[SUGGESTIONS\]:\s*(.+)$/im, '').trim();

    return { cleanAnswer, suggestions };
  }

  return { cleanAnswer: answer, suggestions: [] };
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

Deno.serve(async (req: Request) => {
  try {
    const { prompt, conversationIdentifier, messages, userId } =
      await req.json();
    console.log('Question asked:', prompt);
    console.log('Conversation identifier:', conversationIdentifier);
    console.log('Previous messages count:', messages?.length || 0);
    console.log('User ID:', userId);

    const model = Deno.env.get('GEMINI_MODEL') || 'gemini-2.0-flash';
    const preprompt = Deno.env.get('GEMINI_PREPROMPT') || '';
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ========================================================================
    // FETCH USER ONBOARDING PROFILE
    // ========================================================================
    let userProfileContext = '';
    let userProfileMetadata: any = null;

    if (userId) {
      try {
        const { data: profile, error: profileError } = await supabase
          .from('user_onboarding_profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (!profileError && profile) {
          console.log('Fetched user onboarding profile');

          // Remove metadata fields that aren't useful for AI context
          const {
            id,
            created_at,
            updated_at,
            onboarding_completed,
            onboarding_completed_at,
            ...relevantProfile
          } = profile;

          // Remove null/empty fields to keep context clean
          const cleanedProfile: any = {};
          Object.entries(relevantProfile).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
              // Skip empty arrays
              if (Array.isArray(value) && value.length === 0) return;
              // Skip empty strings
              if (typeof value === 'string' && value.trim() === '') return;
              cleanedProfile[key] = value;
            }
          });

          if (Object.keys(cleanedProfile).length > 0) {
            userProfileMetadata = cleanedProfile;
            userProfileContext = `\n\nUSER PROFILE METADATA:\n${JSON.stringify(cleanedProfile, null, 2)}\n\nThis is the user's onboarding profile. Use this information to personalize your responses. Interpret the field names naturally (e.g., 'persona' = their immigration status, 'time_in_canada' = how long they've been here, 'goals' = what they want to achieve, etc.). Make your responses relevant to their specific situation.`;
            console.log(
              'User profile metadata:',
              JSON.stringify(cleanedProfile)
            );
          } else {
            console.log('No relevant profile data found');
          }
        } else {
          console.log('No profile data found for user:', userId);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        // Continue without profile context if there's an error
      }
    } else {
      console.log('No userId provided, skipping profile fetch');
    }

    // ========================================================================
    // STEP 1: CLASSIFY THE QUERY (runs BEFORE embeddings to save costs)
    // ========================================================================
    const queryType = await classifyQuery(prompt, apiKey!, model);
    console.log('Query classified as:', queryType);

    // Determine if we need RAG (knowledge base search)
    const needsRAG =
      queryType === 'immigration' ||
      queryType === 'newcomer_settlement' ||
      queryType === 'fact_check' ||
      queryType === 'form_help';

    // ========================================================================
    // STEP 2: ROUTE BASED ON CLASSIFICATION
    // ========================================================================
    let contextText = '';
    let sources: Array<{
      document_id: number;
      document_title: string;
      url: string;
    }> = [];
    let hasGoodKBHits = false;
    let disclaimer: string | undefined;

    if (needsRAG) {
      // Use RAG pipeline for immigration-related queries
      console.log('Routing to RAG pipeline for query type:', queryType);

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
      let { data: chunks, error: searchError } = await supabase.rpc(
        'match_chunks',
        {
          query_embedding: queryEmbedding,
          match_threshold: 0.3,
          match_count: 10,
        }
      );

      console.log(`Chunks received for "${prompt}":`, chunks?.length || 0);

      if (searchError) {
        console.error('RPC function error:', searchError);
        const { data: fallbackChunks, error: fallbackError } =
          await supabase.rpc('match_chunks', {
            query_embedding: queryEmbedding,
            match_threshold: 0.0,
            match_count: 10,
          });
        if (!fallbackError && fallbackChunks) {
          chunks = fallbackChunks;
        }
      }

      // Build context from retrieved chunks
      const sourcesMap = new Map<
        number,
        { document_id: number; document_title: string; url: string }
      >();

      const s3BucketName = Deno.env.get('S3_BUCKET_NAME') || 'your-bucket-name';
      const s3Region = Deno.env.get('S3_REGION');

      hasGoodKBHits = chunks && chunks.length > 0;

      if (hasGoodKBHits) {
        chunks.forEach((chunk: any) => {
          const doc = chunk.knowledge_documents || {};
          contextText += `[Document: ${doc.title || 'Unknown'}]\n${chunk.chunk_text}\n\n`;

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
        disclaimer = `${NO_KB_HITS_DISCLAIMER} ${STANDARD_DISCLAIMER}`;
      }
    } else {
      console.log(
        'Routing to general response (no RAG) for query type:',
        queryType
      );
    }

    // ========================================================================
    // STEP 3: BUILD CONVERSATION HISTORY
    // ========================================================================
    const recentMessages =
      messages && Array.isArray(messages) ? messages.slice(-10) : [];

    const conversationHistory = recentMessages.map(
      (msg: { message: string; role: 'user' | 'assistant' }) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.message }],
      })
    );

    console.log('Conversation history messages:', conversationHistory.length);

    // ========================================================================
    // STEP 4: BUILD SYSTEM INSTRUCTION BASED ON QUERY TYPE
    // ========================================================================
    let systemInstruction = '';

    switch (queryType) {
      case 'fact_check':
        systemInstruction = buildFactCheckInstruction(contextText);
        break;
      case 'form_help':
        systemInstruction = buildFormHelpInstruction(contextText);
        break;
      case 'immigration':
      case 'newcomer_settlement':
        if (hasGoodKBHits && contextText) {
          systemInstruction = buildImmigrationSystemInstruction(contextText);
        } else {
          systemInstruction = buildImmigrationNoKBInstruction();
        }
        break;
      default:
        systemInstruction = buildGeneralSystemInstruction();
    }

    // Add user profile context and preprompt if available
    // Profile context goes FIRST so the AI sees it immediately
    let fullSystemInstruction = '';

    if (preprompt) {
      fullSystemInstruction = `${preprompt}\n\n`;
    }

    if (userProfileContext) {
      fullSystemInstruction += `${userProfileContext}\n\n`;
    } else {
      // Add explicit note if no profile is available
      fullSystemInstruction += `\nNOTE: No user profile information is currently available.\n\n`;
    }

    fullSystemInstruction += systemInstruction;

    console.log('Has user profile context:', !!userProfileContext);
    console.log('Conversation history messages:', conversationHistory.length);
    console.log(
      'Full system instruction length:',
      fullSystemInstruction.length
    );

    if (!userProfileContext && conversationHistory.length === 0) {
      console.warn(
        'WARNING: No user profile AND no conversation history available!'
      );
    }

    // ========================================================================
    // STEP 5: BUILD REQUEST AND CALL GEMINI
    // ========================================================================
    const contents = [];

    // Add system instruction as first message (Gemini uses this as context)
    contents.push({
      role: 'user',
      parts: [{ text: fullSystemInstruction }],
    });
    contents.push({
      role: 'model',
      parts: [
        {
          text: 'Understood. I have access to the full conversation history and user profile. I will use this context in my responses and will NOT claim I lack access to previous conversations or personal information.',
        },
      ],
    });

    // Add conversation history
    contents.push(...conversationHistory);

    // Add current user question
    contents.push({
      role: 'user',
      parts: [{ text: prompt }],
    });

    const requestBody = {
      contents: contents,
      generationConfig: {
        maxOutputTokens: 1200, // Increased for suggestions
      },
    };

    console.log('Gemini API Request Details:');
    console.log('- Model:', model);
    console.log('- Query type:', queryType);
    console.log('- Has good KB hits:', hasGoodKBHits);

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
      console.error('Gemini API error:', response.status, errorText);
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const geminiData = await response.json();

    // Extract answer from Gemini response
    let rawAnswer = 'Sorry, I could not generate a response.';
    if (geminiData.candidates?.[0]?.content?.parts?.[0]) {
      rawAnswer = geminiData.candidates[0].content.parts[0].text.trim();
    }

    // Parse out suggestions from the response
    const { cleanAnswer, suggestions } =
      parseSuggestionsFromResponse(rawAnswer);

    // ========================================================================
    // STEP 6: RETURN RESPONSE
    // ========================================================================
    return new Response(
      JSON.stringify({
        answer: cleanAnswer,
        sources: sources.length > 0 ? sources : undefined,
        queryType,
        disclaimer,
        suggestedNextSteps: suggestions.length > 0 ? suggestions : undefined,
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
