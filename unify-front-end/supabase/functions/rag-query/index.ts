// @ts-nocheck We do not need the actual Deno import since it's used by supabase serverless functions so ignore
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { fetchWithRetry } from '../_shared/fetchWithRetry.ts';
import { callOpenRouter } from '../_shared/openrouter.ts';
import { captureAiGeneration } from '../_shared/posthogCapture.ts';

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

const EMBEDDING_MODEL =
  Deno.env.get('OPENAI_EMBEDDING_MODEL') || 'text-embedding-3-small';

const INVALID_ASSISTANT_LED_PATTERNS: RegExp[] = [
  /^would you like\b/i,
  /^do you want\b/i,
  /^can i\b/i,
  /^what kind of information are you looking for\b/i,
  /^what are you looking for\b/i,
  /^how can i help\b/i,
  /^what would you like\b/i,
  /\blet me know\b/i,
  /\bi can help\b/i,
  /\bwould you like me to\b/i,
];

const USER_QUESTION_STARTS = [
  'what',
  'how',
  'can',
  'should',
  'when',
  'where',
  'why',
  'which',
  'is',
  'are',
  'do',
  'does',
  'could',
  'would',
  'who',
];

function sanitizeSuggestedNextSteps(suggestions: string[]): string[] {
  if (!suggestions || suggestions.length === 0) return [];

  const deduped = new Set<string>();

  return suggestions
    .map(s => s.replace(/^[\s"'`-]+|[\s"'`]+$/g, '').trim())
    .filter(s => s.length >= 10)
    .filter(
      s => !INVALID_ASSISTANT_LED_PATTERNS.some(pattern => pattern.test(s))
    )
    .map(s => {
      const lower = s.toLowerCase();
      const startsLikeQuestion = USER_QUESTION_STARTS.some(word =>
        lower.startsWith(`${word} `)
      );
      if (startsLikeQuestion && !s.endsWith('?')) {
        return `${s}?`;
      }
      return s;
    })
    .filter(s => s.endsWith('?'))
    .filter(s => {
      const key = s.toLowerCase();
      if (deduped.has(key)) return false;
      deduped.add(key);
      return true;
    })
    .slice(0, 3);
}

function buildUserProfileContext(profile: Record<string, unknown>): string {
  const persona = profile.persona as string | null;
  const city = profile.city as string | null;
  const province = profile.province as string | null;
  const arrivalDate = profile.arrival_date as string | null;
  const goals = (profile.goals as string[] | null) ?? [];
  const learningInterests =
    (profile.learning_interests as string[] | null) ?? [];

  // Build prompt parts, omitting null/empty fields gracefully
  const parts: string[] = [];

  if (persona && city && province) {
    parts.push(
      `You are speaking with a ${persona.replace(/_/g, ' ')} who arrived in ${city}, ${province}${arrivalDate ? ` on ${arrivalDate.split('T')[0]}` : ''}.`
    );
  } else if (persona && province) {
    parts.push(
      `You are speaking with a ${persona.replace(/_/g, ' ')} in ${province}${arrivalDate ? `, who arrived on ${arrivalDate.split('T')[0]}` : ''}.`
    );
  } else if (persona) {
    parts.push(
      `You are speaking with a ${persona.replace(/_/g, ' ')} in Canada${arrivalDate ? `, who arrived on ${arrivalDate.split('T')[0]}` : ''}.`
    );
  }

  if (goals.length > 0) {
    parts.push(
      `Their goals: ${goals.map(g => g.replace(/_/g, ' ')).join(', ')}.`
    );
  }

  if (learningInterests.length > 0) {
    parts.push(
      `Their interests: ${learningInterests.map(i => i.replace(/_/g, ' ')).join(', ')}.`
    );
  }

  if (parts.length === 0) return '';

  parts.push(
    `Tailor your responses to their specific situation, location, and goals.`
  );

  if (city) {
    parts.push(`Refer to local resources in ${city} when relevant.`);
  }

  return `\nUSER PROFILE CONTEXT:\n${parts.join(' ')}`;
}

async function fetchUserProfileContext(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<string> {
  try {
    const { data: profile, error: profileError } = await supabase
      .from('user_onboarding_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (profileError || !profile) {
      return '';
    }

    const userProfileContext = buildUserProfileContext(profile);
    console.log('User profile context loaded:', userProfileContext.length > 0);
    return userProfileContext;
  } catch (_profileFetchError) {
    console.error('Failed to fetch user onboarding profile context');
    return '';
  }
}

async function persistChatbotUsage(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  tokenUsage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  },
  estimatedCostUsd?: number
): Promise<void> {
  try {
    const { error } = await supabase.rpc('increment_chatbot_usage', {
      p_user_id: userId,
      p_tokens: tokenUsage.total_tokens,
      p_cost: estimatedCostUsd || 0,
    });

    if (error) {
      throw error;
    }
  } catch (costError) {
    console.error('Failed to store token usage:', costError);
  }
}

function scheduleBackgroundTask(task: Promise<unknown>) {
  const edgeRuntime = (
    globalThis as typeof globalThis & {
      EdgeRuntime?: {
        waitUntil?: (promise: Promise<unknown>) => void;
      };
    }
  ).EdgeRuntime;

  if (edgeRuntime?.waitUntil) {
    edgeRuntime.waitUntil(task);
    return;
  }

  void task.catch(error => {
    console.error('Background task failed:', error);
  });
}

async function resolveAuthenticatedUserId(
  req: Request,
  supabaseUrl: string,
  supabaseServiceKey: string
): Promise<string | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return null;

  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || supabaseServiceKey;
  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error,
  } = await authClient.auth.getUser();

  if (error || !user) {
    console.warn('Unable to resolve authenticated user from JWT');
    return null;
  }

  return user.id;
}

// ============================================================================
// CLASSIFIER FUNCTION
// ============================================================================

/**
 * Classifies the user query to determine routing.
 * Runs BEFORE embeddings/RAG to avoid unnecessary vector searches for general queries.
 */
async function classifyQuery(prompt: string): Promise<QueryType> {
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

  const result = await callOpenRouter({
    messages: [
      { role: 'system', content: classifierSystemMessage },
      { role: 'user', content: prompt },
    ],
    maxTokens: 15,
    temperature: 0,
    timeoutMs: 12000,
    retries: 1,
    retryDelayMs: 300,
    appName: 'Unify — rag-query classifier',
  });

  if (!result.ok) {
    // Fall back to 'immigration' on classifier failure — for an immigration-
    // help app, that's the safest default: it triggers RAG grounding and the
    // immigration system prompt with disclaimer/guardrails. A 'general'
    // fallback would skip RAG and the disclaimer for a query that may well
    // have been about immigration.
    console.error('Classifier OpenRouter call failed:', result.message);
    return 'immigration';
  }

  const label = result.content.trim().toLowerCase();
  console.log('Classifier result:', label);

  if (label === 'immigration') return 'immigration';
  if (label === 'newcomer_settlement') return 'newcomer_settlement';
  if (label === 'fact_check') return 'fact_check';
  if (label === 'form_help') return 'form_help';
  return 'general';
}

// ============================================================================
// SYSTEM INSTRUCTIONS
// ============================================================================

/**
 * Common footer for generating suggested next steps
 */
const SUGGESTIONS_INSTRUCTION = `

SUGGESTED NEXT STEPS:
At the very end of your response, suggest 2-3 brief follow-up questions the user might ask YOU next. These should be natural continuations of the conversation.
Each suggestion must be written from the user's perspective (a direct question to the assistant).
DO NOT write assistant-to-user prompts like:
- "Would you like me to..."
- "What kind of information are you looking for today?"
- "Do you want help with..."
Format them on a new line starting with "[SUGGESTIONS]:" followed by the questions separated by "|".
Example: [SUGGESTIONS]: How do I open a TFSA? | What's the contribution limit? | Can I withdraw anytime?`;

/**
 * Build system instruction for immigration/newcomer queries WITH knowledge base context
 */
function buildImmigrationSystemInstruction(contextText: string): string {
  return `You are Unify's AI assistant, helping newcomers to Canada navigate immigration and settlement topics. You are friendly, supportive, and knowledgeable.

CONTEXT FROM KNOWLEDGE BASE:
${contextText}

CRITICAL: BREVITY IS KEY
Users are on mobile. Keep responses short and scannable. Avoid walls of text. Get to the point quickly.

RESPONSE FORMAT:
Start with a direct 1-2 sentence answer. Then provide 2-3 sentences of essential context using simple, newcomer-friendly language. Explain acronyms briefly (e.g., "TFSA" = Tax-Free Savings Account).

If there are key steps or items to list, use bullet points (- item).

End with one actionable next step the user can take.

Do NOT use ## section headers like "Short Answer" or "Explanation" — just flow naturally from answer to context to next step. Do NOT include an "Important Notes" or disclaimer section — the app already shows a disclaimer.

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

CRITICAL: BREVITY IS KEY
Users are on mobile. Keep responses short and scannable. Avoid walls of text. Get to the point quickly.

RESPONSE FORMAT:
Start with a direct 1-2 sentence answer. Then provide 2-3 sentences of essential context using simple, newcomer-friendly language. Explain acronyms briefly.

If there are key steps or items to list, use bullet points (- item).

End with one actionable next step the user can take.

Do NOT use ## section headers like "Short Answer" or "Explanation" — just flow naturally from answer to context to next step. Do NOT include an "Important Notes" or disclaimer section — the app already shows a disclaimer.

Note: You are answering from general knowledge (not the knowledge base). Mention that users should verify with official sources like IRCC.

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

Do NOT include a disclaimer section — the app already shows one.

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
  const suggestionsMatch = answer.match(/\[SUGGESTIONS\]:\s*([\s\S]*)$/im);

  if (suggestionsMatch) {
    const suggestionsText = suggestionsMatch[1].trim();
    const rawSuggestions = suggestionsText
      .replace(/\n+/g, ' ')
      .split('|')
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .slice(0, 6);

    const suggestions = sanitizeSuggestedNextSteps(rawSuggestions);

    // Remove the suggestions line from the answer
    const cleanAnswer = answer
      .replace(/\[SUGGESTIONS\]:\s*([\s\S]*)$/im, '')
      .trim();

    return { cleanAnswer, suggestions };
  }

  return { cleanAnswer: answer, suggestions: [] };
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

Deno.serve(async (req: Request) => {
  const totalStart = performance.now();
  const stageTimings = {
    auth_ms: 0,
    profile_ms: 0,
    classify_ms: 0,
    embedding_ms: 0,
    vector_search_ms: 0,
    generation_ms: 0,
    total_ms: 0,
  };

  const logStageTimings = (status: 'success' | 'error') => {
    stageTimings.total_ms = Math.round(performance.now() - totalStart);
    console.log(
      'rag-query timing',
      JSON.stringify({
        status,
        ...stageTimings,
      })
    );
  };

  try {
    const {
      prompt,
      conversationIdentifier,
      messages,
      userId: requestUserId,
    } = await req.json();

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const preprompt = Deno.env.get('GEMINI_PREPROMPT') || '';
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!Deno.env.get('OPENROUTER_API_KEY')) {
      throw new Error('Missing OPENROUTER_API_KEY');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const authStartedAt = performance.now();
    const authPromise = resolveAuthenticatedUserId(
      req,
      supabaseUrl,
      supabaseServiceKey
    ).then(userId => {
      stageTimings.auth_ms = Math.round(performance.now() - authStartedAt);
      return userId;
    });
    const classifyStartedAt = performance.now();
    const classifyPromise = classifyQuery(prompt.trim()).then(queryType => {
      stageTimings.classify_ms = Math.round(
        performance.now() - classifyStartedAt
      );
      return queryType;
    });

    const authenticatedUserId = await authPromise;

    // Require authentication — reject unauthenticated requests to prevent
    // abuse and uncontrolled API credit consumption.
    if (!authenticatedUserId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const effectiveUserId = authenticatedUserId;

    // Atomic rate limit: check + increment in one RPC (fail-closed).
    // Returns false if over the daily cap or on any DB error.
    const DAILY_MESSAGE_LIMIT = 30;
    const { data: allowed, error: quotaError } = await supabase.rpc(
      'check_and_increment_chatbot_usage',
      { p_user_id: effectiveUserId, p_daily_limit: DAILY_MESSAGE_LIMIT }
    );

    if (quotaError || allowed === false) {
      return new Response(
        JSON.stringify({ error: 'Daily message limit reached. Try again tomorrow.' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (
      requestUserId &&
      authenticatedUserId &&
      requestUserId !== authenticatedUserId
    ) {
      console.warn('Ignoring mismatched request userId and authenticated user');
    }

    const profilePromise = effectiveUserId
      ? (async () => {
          const profileStartedAt = performance.now();
          const userProfileContext = await fetchUserProfileContext(
            supabase,
            effectiveUserId
          );
          stageTimings.profile_ms = Math.round(
            performance.now() - profileStartedAt
          );
          return userProfileContext;
        })()
      : Promise.resolve('');

    // ========================================================================
    // STEP 1: CLASSIFY THE QUERY (runs BEFORE embeddings to save costs)
    // ========================================================================
    const queryType = await classifyPromise;
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
    let lastVerified: string | undefined;

    if (needsRAG) {
      // Use RAG pipeline for immigration-related queries
      console.log('Routing to RAG pipeline for query type:', queryType);

      if (!openaiApiKey) {
        console.warn(
          'OPENAI_API_KEY is missing. Proceeding without KB retrieval for this request.'
        );
      } else {
        // Generate embedding for user query
        const embeddingStartedAt = performance.now();
        const embeddingResponse = await fetchWithRetry(
          'https://api.openai.com/v1/embeddings',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${openaiApiKey}`,
            },
            body: JSON.stringify({
              model: EMBEDDING_MODEL,
              input: prompt,
            }),
          },
          { timeoutMs: 15000, retries: 2, retryDelayMs: 400 }
        );

        if (!embeddingResponse.ok) {
          throw new Error(
            `OpenAI embedding API error: ${embeddingResponse.statusText}`
          );
        }

        const embeddingData = await embeddingResponse.json();
        const queryEmbedding = embeddingData.data[0].embedding;
        stageTimings.embedding_ms = Math.round(
          performance.now() - embeddingStartedAt
        );

        // Search for similar chunks in database
        const vectorSearchStartedAt = performance.now();
        let { data: chunks, error: searchError } = await supabase.rpc(
          'match_chunks',
          {
            query_embedding: queryEmbedding,
            match_threshold: 0.3,
            match_count: 10,
          }
        );
        stageTimings.vector_search_ms = Math.round(
          performance.now() - vectorSearchStartedAt
        );

        console.log(`Chunks received for "${prompt}":`, chunks?.length || 0);

        if (searchError) {
          console.error('RPC function error:', searchError);
          chunks = [];
        }

        // Build context from retrieved chunks
        const sourcesMap = new Map<
          number,
          { document_id: number; document_title: string; url: string }
        >();

        const s3BucketName =
          Deno.env.get('S3_BUCKET_NAME') || 'your-bucket-name';
        const s3Region = Deno.env.get('S3_REGION');

        hasGoodKBHits = chunks && chunks.length > 0;

        if (hasGoodKBHits) {
          // Track the most recent updated_at across all returned chunks
          let mostRecentUpdate: string | undefined;

          chunks.forEach((chunk: any) => {
            const doc = chunk.knowledge_documents || {};
            contextText += `[Document: ${doc.title || 'Unknown'}]\n${chunk.chunk_text}\n\n`;

            // Track most recent document update for lastVerified
            const docUpdatedAt = doc.updated_at;
            if (
              docUpdatedAt &&
              (!mostRecentUpdate || docUpdatedAt > mostRecentUpdate)
            ) {
              mostRecentUpdate = docUpdatedAt;
            }

            if (!sourcesMap.has(chunk.document_id)) {
              // Prefer source_url from the document (set by crawler),
              // fall back to S3 URL, then generic IRCC page
              const sourceUrl = doc.source_url;
              const storagePath = doc.storage_path || '';
              const hasSourceConfig =
                !!s3BucketName &&
                s3BucketName !== 'your-bucket-name' &&
                !!s3Region &&
                !!storagePath;
              const s3Url = hasSourceConfig
                ? `https://${s3BucketName}.s3.${s3Region}.amazonaws.com/${storagePath}`
                : '';

              sourcesMap.set(chunk.document_id, {
                document_id: chunk.document_id,
                document_title: doc.title || 'Unknown',
                url:
                  sourceUrl ||
                  s3Url ||
                  'https://www.canada.ca/en/immigration-refugees-citizenship.html',
              });
            }
          });

          lastVerified = mostRecentUpdate;

          sources = Array.from(sourcesMap.values());
          disclaimer = STANDARD_DISCLAIMER;
        }
      }
      disclaimer = hasGoodKBHits
        ? disclaimer
        : `${NO_KB_HITS_DISCLAIMER} ${STANDARD_DISCLAIMER}`;
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
        role: msg.role === 'user' ? ('user' as const) : ('assistant' as const),
        content: msg.message,
      })
    );

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

    // Add preprompt if available
    const userProfileContext = await profilePromise;
    let fullSystemInstruction = preprompt
      ? `${preprompt}\n\n${systemInstruction}`
      : systemInstruction;
    if (userProfileContext) {
      fullSystemInstruction = `${fullSystemInstruction}\n\n${userProfileContext}`;
    }

    // ========================================================================
    // STEP 5: BUILD REQUEST AND CALL OPENROUTER
    // ========================================================================
    const messagesForLlm = [
      { role: 'system' as const, content: fullSystemInstruction },
      ...conversationHistory,
      { role: 'user' as const, content: prompt },
    ];

    console.log('OpenRouter Request Details:');
    console.log('- Query type:', queryType);
    console.log('- Has good KB hits:', hasGoodKBHits);

    const generationStartedAt = performance.now();
    const llmResult = await callOpenRouter({
      messages: messagesForLlm,
      maxTokens: 1200,
      timeoutMs: 25000,
      retries: 1,
      retryDelayMs: 500,
      appName: 'Unify — AI Companion',
    });
    stageTimings.generation_ms = Math.round(
      performance.now() - generationStartedAt
    );

    if (!llmResult.ok) {
      // Surface upstream rate-limit / capacity issues as a 503 with a
      // user-friendly message instead of a generic 500. The client
      // detects 503 from this function and shows a "busy, try again"
      // toast rather than an opaque error.
      if (llmResult.retryable) {
        logStageTimings('error');
        return new Response(
          JSON.stringify({
            error:
              'AI Companion is busy right now. Please try again in a minute.',
            code: 'ai_companion_busy',
          }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
      console.error('OpenRouter call failed:', llmResult.message);
      throw new Error(llmResult.message);
    }

    const rawAnswer = llmResult.content || 'Sorry, I could not generate a response.';

    const tokenUsage = {
      prompt_tokens: llmResult.usage.promptTokens,
      completion_tokens: llmResult.usage.completionTokens,
      total_tokens: llmResult.usage.totalTokens,
    };
    const estimatedCostUsd = llmResult.usage.costUsd;

    // Send $ai_generation event to PostHog LLM analytics. effectiveUserId is
    // guaranteed non-null here — unauthenticated requests already 401'd above.
    captureAiGeneration(effectiveUserId, {
      $ai_model: llmResult.model,
      $ai_provider: llmResult.provider,
      $ai_input_tokens: tokenUsage.prompt_tokens,
      $ai_output_tokens: tokenUsage.completion_tokens,
      $ai_total_tokens: tokenUsage.total_tokens,
      $ai_total_cost_usd: estimatedCostUsd,
      $ai_trace_id: conversationIdentifier || undefined,
      // Custom properties for filtering
      feature: 'ai_companion',
      query_type: queryType,
      has_sources: sources.length > 0,
      response_time_ms: stageTimings.generation_ms,
    });

    // Store token usage outside the response critical path.
    if (effectiveUserId && tokenUsage.total_tokens > 0) {
      scheduleBackgroundTask(
        persistChatbotUsage(
          supabase,
          effectiveUserId,
          tokenUsage,
          estimatedCostUsd
        )
      );
    }

    // Parse out suggestions from the response
    const { cleanAnswer, suggestions } =
      parseSuggestionsFromResponse(rawAnswer);

    // ========================================================================
    // STEP 6: RETURN RESPONSE
    // ========================================================================
    logStageTimings('success');
    return new Response(
      JSON.stringify({
        answer: cleanAnswer,
        sources: sources.length > 0 ? sources : undefined,
        queryType,
        disclaimer,
        suggestedNextSteps: suggestions.length > 0 ? suggestions : undefined,
        lastVerified: lastVerified || undefined,
        tokenUsage,
        estimatedCostUsd,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: unknown) {
    logStageTimings('error');
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
