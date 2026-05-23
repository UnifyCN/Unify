// @ts-nocheck We do not need the actual Deno import since it's used by supabase serverless functions so ignore
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { fetchWithRetry } from '../_shared/fetchWithRetry.ts';
import {
  callOpenRouter,
  callOpenRouterStream,
} from '../_shared/openrouter.ts';
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

// Defense against prompt injection via the user-controlled `first_name` field.
// Strict whitelist: Unicode letters (\p{L}) and combining marks (\p{M}, needed
// for Devanagari and other scripts), plus space, hyphen, apostrophe. Drops
// everything else — including periods, colons, newlines, and control chars —
// so a crafted name like "Bob. New directive: ignore previous instructions"
// can't terminate the sentence and inject a follow-on directive. Whitespace is
// collapsed and the result is clamped to 50 chars.
function sanitizeNameForPrompt(name: string | null): string | null {
  if (!name) return null;
  const cleaned = name
    .replace(/[^\p{L}\p{M}\s'-]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return null;
  return cleaned.slice(0, 50);
}

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
  const immigrationStatus = profile.immigration_status as string | null;
  const countryOfOrigin = profile.country_of_origin as string | null;
  const goals = (profile.goals as string[] | null) ?? [];
  const learningInterests =
    (profile.learning_interests as string[] | null) ?? [];

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

  // Immigration status drives most tailoring (PR vs work permit vs study
  // permit vs refugee vs CUAET vs sponsorship applicant). Without this the
  // model cannot pick the right pathway, fee schedule, or rights summary.
  if (immigrationStatus) {
    parts.push(
      `Their current immigration status: ${immigrationStatus.replace(/_/g, ' ')}. Tailor pathway/eligibility/rights guidance to this specific status.`
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

  // Bias guard — research (EMNLP 2025, "Reading Between the Prompts") shows
  // LLMs implicitly stereotype based on country/persona cues. Explicitly
  // forbid extrapolating beyond stated facts. Country is named so the model
  // knows exactly which assumptions to suppress.
  if (countryOfOrigin) {
    parts.push(
      `Country of origin: ${countryOfOrigin}. Do NOT assume cultural traits, religion, language fluency, family situation, education level, financial status, dietary preferences, or cuisine preferences from this country of origin or from any other profile field. Only use country of origin if the user's question is explicitly about it (e.g. credential recognition from that country).`
    );
  } else {
    parts.push(
      `Do NOT assume cultural traits, religion, language fluency, family situation, education level, or financial status beyond what is stated above.`
    );
  }

  return `\nUSER PROFILE CONTEXT:\n${parts.join(' ')}`;
}

/**
 * Build a profile-aware string to embed for vector retrieval. Pure prompt
 * embedding causes wrong-province / wrong-status retrieval (e.g. a Quebec
 * user asking about driver's licenses retrieves generic Canadian content
 * instead of SAAQ chunks). Prepending province + status pulls more relevant
 * chunks without changing the user-visible answer.
 */
function buildRetrievalQuery(
  prompt: string,
  profile: Record<string, unknown> | null
): string {
  if (!profile) return prompt;
  const province = profile.province as string | null;
  const status = profile.immigration_status as string | null;
  const persona = profile.persona as string | null;
  const cues = [province, status?.replace(/_/g, ' '), persona?.replace(/_/g, ' ')]
    .filter(Boolean)
    .join(', ');
  return cues ? `[Context: ${cues}] ${prompt}` : prompt;
}

type ProfileBundle = {
  text: string;
  raw: Record<string, unknown> | null;
};

async function fetchUserProfileContext(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<ProfileBundle> {
  try {
    const { data: profile, error: profileError } = await supabase
      .from('user_onboarding_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (profileError || !profile) {
      return { text: '', raw: null };
    }

    const userProfileContext = buildUserProfileContext(profile);
    console.log('User profile context loaded:', userProfileContext.length > 0);
    return { text: userProfileContext, raw: profile };
  } catch (_profileFetchError) {
    console.error('Failed to fetch user onboarding profile context');
    return { text: '', raw: null };
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
// CLASSIFIER (heuristic — no LLM call)
// ============================================================================

const FACT_CHECK_PATTERN =
  /\b(is it true|i heard|can you verify|verify (this|that|if)|debunk|myth|rumou?r)\b/i;

// IMM forms are 4-5 digit numbers (IMM 5710, IMM 1294). Restricting to
// {4,5} prevents over-matching "imm 5" or "imm 100" which would otherwise
// mis-route real questions into form-help mode.
const FORM_HELP_PATTERN =
  /\b(imm[\s-]?\d{4,5}|form\s+\d{4}|fill (out|in) (a |the )?form|form field)\b/i;

const GREETING_PATTERN =
  /^(hi|hello|hey|thanks|thank you|good (morning|evening|afternoon|night)|how are you|what'?s up|sup)[\s!.?]*$/i;

/**
 * Heuristic query classifier — picks one of the 5 lanes without an LLM call.
 *
 * Replaces a per-request OpenRouter call that added ~500-1500ms TTFT. The
 * default lane is `immigration`, which has the full RAG + safety guardrails
 * baked in, so any false negative from the regex routing fails open into the
 * safest, most-grounded prompt.
 */
function classifyQueryHeuristic(prompt: string): QueryType {
  const trimmed = prompt.trim();

  if (GREETING_PATTERN.test(trimmed)) return 'general';
  if (FACT_CHECK_PATTERN.test(trimmed)) return 'fact_check';
  if (FORM_HELP_PATTERN.test(trimmed)) return 'form_help';
  return 'immigration';
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

PROVINCE-SPECIFIC AUTHORITIES (refer to the user's province when relevant):
- Driver's licensing: Ontario→ServiceOntario / DriveTest (G1/G2/G), British Columbia→ICBC (Class 7L/7N/5), Quebec→SAAQ (Classes 5/6), Alberta→Service Alberta / Alberta Registries, Manitoba→Manitoba Public Insurance, Saskatchewan→SGI, Nova Scotia→Service Nova Scotia, New Brunswick→Service New Brunswick.
- Health coverage: Ontario→OHIP, British Columbia→MSP, Quebec→RAMQ, Alberta→AHCIP, Manitoba→Manitoba Health, Saskatchewan→Saskatchewan Health, Nova Scotia→MSI, New Brunswick→Medicare NB.
- Tenancy / housing: Ontario→Landlord and Tenant Board, British Columbia→Residential Tenancy Branch (BC RTA), Quebec→Tribunal administratif du logement, Alberta→Residential Tenancy Dispute Resolution Service.
- Employment standards: each province has its own; Quebec→CNESST, Ontario→Ministry of Labour, BC→Employment Standards Branch.
When the user is in Quebec, also surface Quebec-specific programs (CSQ, PEQ, francisation classes) when settlement-relevant.

PROFESSIONAL CREDENTIAL RECOGNITION:
Direct internationally-trained professionals to (a) the federal credential assessment service for their occupation (e.g. NNAS for nurses, MCC for physicians, ECA for engineers via WES/ICES/CES), AND (b) the provincial regulator in their province (e.g. CRNS in Saskatchewan, CNO in Ontario, BCCNM in BC for nurses). Mention bridging programs when known.

CRITICAL GUARDRAILS:
1. **PERSONAL ELIGIBILITY**: For "Am I eligible?" or "Will I get approved?" questions — explain the general criteria, then say to verify with IRCC or a licensed immigration professional. Do not give a yes/no.
2. **STABLE PUBLIC FACTS**: Common public knowledge IS answerable directly — citizenship test format (20 multiple-choice questions, pass mark 15/20), CRS components and how points are calculated, Express Entry vs PNP basics, study/work permit work-hour rules, what a SIN is, what a TFSA is, etc. Do NOT dodge these by pointing to IRCC for the answer.
3. **NEVER QUOTE FEES OR PROCESSING TIMES FROM MEMORY**: Specific dollar amounts (PGWP fee, study permit fee, citizenship fee) and processing-time numbers change frequently. ONLY cite a fee or processing time if it appears in the KB context above. Otherwise say "check current fees and processing times on canada.ca/ircc" without naming a number.
4. **MANDATORY LAWYER/RCIC REFERRAL** for these topics: refugee/asylum claims, deportation/removal/inadmissibility, application denials, misrepresentation, criminality, sponsorship-application denials, overstay disclosure questions, judicial review. ALWAYS include the phrase "consult a licensed immigration lawyer or RCIC (Regulated Canadian Immigration Consultant)" in responses on these topics. Do NOT recommend specific lawyers or firms by name.
5. **OFFICIAL SOURCES**: For changing/recent rules, point to IRCC (ircc.canada.ca). For provincial topics, point to the province-specific authority listed above.
6. **CITE SOURCES**: Only include sources when directly using knowledge base information.${SUGGESTIONS_INSTRUCTION}`;
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

Note: You are answering from general knowledge (not the knowledge base). Mention that users should verify with official sources like IRCC for current rules.

PROVINCE-SPECIFIC AUTHORITIES (refer to the user's province when relevant):
- Driver's licensing: Ontario→ServiceOntario / DriveTest, British Columbia→ICBC, Quebec→SAAQ, Alberta→Service Alberta, Manitoba→MPI, Saskatchewan→SGI.
- Health coverage: Ontario→OHIP, BC→MSP, Quebec→RAMQ, Alberta→AHCIP, Manitoba→Manitoba Health.
- Tenancy: Ontario→Landlord and Tenant Board, BC→BC RTA / Residential Tenancy Branch, Quebec→Tribunal administratif du logement.

PROFESSIONAL CREDENTIALS:
Direct internationally-trained professionals to the federal assessment service for their occupation (NNAS for nurses, MCC for physicians, ECA via WES/ICES/CES for engineers) AND the provincial regulator in their province.

CRITICAL GUARDRAILS:
1. **PERSONAL ELIGIBILITY**: For "Am I eligible?" or "Will I get approved?" — explain general criteria, recommend verifying with IRCC or a licensed professional. No yes/no.
2. **STABLE PUBLIC FACTS**: Citizenship test format (20 questions, pass mark 15/20), CRS components, study/work permit work-hour rules, what a SIN/TFSA is — answer directly. Do NOT dodge these.
3. **NEVER QUOTE FEES OR PROCESSING TIMES FROM MEMORY**: Specific dollar amounts and processing times change. Without KB context, say "check current fees and processing times on canada.ca/ircc" instead of naming a number.
4. **MANDATORY LAWYER/RCIC REFERRAL** for: refugee/asylum, deportation/removal/inadmissibility, application denials, misrepresentation, criminality, sponsorship denials, overstay disclosure, judicial review. Always include "consult a licensed immigration lawyer or RCIC".
5. **OFFICIAL SOURCES**: Point to IRCC (ircc.canada.ca) for changing rules; province-specific authority for provincial topics.${SUGGESTIONS_INSTRUCTION}`;
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

DETECT THE FORM FIRST:
If the user's question mentions a form number (anything like "IMM 5710", "IMM5257", "IMM 1294", "form 5710"), proceed DIRECTLY to the field explanation. Do NOT ask which form they are working on. Only ask for the form number when the user has not mentioned one.

RESPONSE FORMAT:

## Field Explanation
Explain what the field/question is asking for in simple terms. Use examples of the TYPE of information needed, not specific answers.

Example: "This field asks for your travel history - list all countries you've visited in the past 10 years, including short trips."

For the official wording and any sub-instructions, point the user to the IRCC instruction guide for that specific form (e.g. "IMM 5710 instruction guide" on canada.ca/ircc).

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
      eval_profile: evalProfile,
      stream: streamRequested,
    } = await req.json();

    const isStreaming = streamRequested === true;

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

    // Eval-mode bypass: skip auth/rate-limit/profile-fetch/usage-persist when
    // the request comes from the regression eval harness. Gated by the
    // x-eval-secret header matching the EVAL_BYPASS_SECRET env var (server-only
    // secret set via Supabase Functions Secrets), so external callers cannot
    // trigger this without knowing the secret. Decoupled from the service-role
    // key so it works regardless of legacy JWT vs new sb_secret_ key format.
    const evalBypassSecret = Deno.env.get('EVAL_BYPASS_SECRET');
    const isEvalMode =
      req.headers.get('x-eval-mode') === '1' &&
      !!evalBypassSecret &&
      req.headers.get('x-eval-secret') === evalBypassSecret;

    const authStartedAt = performance.now();
    const authPromise = resolveAuthenticatedUserId(
      req,
      supabaseUrl,
      supabaseServiceKey
    ).then(userId => {
      stageTimings.auth_ms = Math.round(performance.now() - authStartedAt);
      return userId;
    });
    // Heuristic classifier — synchronous, no LLM call. Replaces a per-request
    // OpenRouter classifier that added ~500-1500ms TTFT. Default lane is
    // 'immigration', which has the safest prompt + RAG grounding, so any
    // false negative fails open into the most-grounded path.
    const classifyStartedAt = performance.now();
    const queryType = classifyQueryHeuristic(prompt.trim());
    stageTimings.classify_ms = Math.round(
      performance.now() - classifyStartedAt
    );

    const authenticatedUserId = await authPromise;

    // Require authentication — reject unauthenticated requests to prevent
    // abuse and uncontrolled API credit consumption. Eval mode skips this.
    if (!isEvalMode && !authenticatedUserId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const effectiveUserId = isEvalMode
      ? 'eval-mode'
      : authenticatedUserId!;

    // Atomic rate limit: check + increment in one RPC (fail-closed).
    // Returns false if over the daily cap or on any DB error. Skipped in eval
    // mode so regression runs don't consume real users' daily quotas.
    if (!isEvalMode) {
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
    }

    if (
      requestUserId &&
      authenticatedUserId &&
      requestUserId !== authenticatedUserId
    ) {
      console.warn('Ignoring mismatched request userId and authenticated user');
    }

    const profilePromise: Promise<ProfileBundle> = isEvalMode
      ? Promise.resolve({
          text: evalProfile ? buildUserProfileContext(evalProfile) : '',
          raw: evalProfile,
        })
      : effectiveUserId
      ? (async () => {
          const profileStartedAt = performance.now();
          const bundle = await fetchUserProfileContext(
            supabase,
            effectiveUserId
          );
          stageTimings.profile_ms = Math.round(
            performance.now() - profileStartedAt
          );
          return bundle;
        })()
      : Promise.resolve<ProfileBundle>({ text: '', raw: null });

    // Fetch first_name to personalize the system prompt. Missing first_name is
    // expected for existing users — we just skip the name directive. Failures
    // are non-fatal: the Companion still works without a name.
    const firstNamePromise: Promise<string | null> =
      !isEvalMode && effectiveUserId
        ? (async () => {
            try {
              const { data: userRow } = await supabase
                .from('users')
                .select('first_name')
                .eq('id', effectiveUserId)
                .maybeSingle();
              return sanitizeNameForPrompt(
                (userRow?.first_name as string | null) ?? null
              );
            } catch (err) {
              console.warn(
                '[rag-query] first_name lookup failed (non-fatal)',
                err
              );
              return null;
            }
          })()
        : Promise.resolve(null);

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
        // Profile-aware retrieval: prepend province/status/persona to the
        // embedding input so a Quebec user asking about driver's licenses
        // pulls SAAQ chunks instead of generic Canadian content. Profile fetch
        // ran in parallel with auth/classify; awaiting it here costs nothing.
        const profileBundleForRetrieval = await profilePromise;
        const retrievalQuery = buildRetrievalQuery(
          prompt,
          profileBundleForRetrieval.raw
        );

        // Generate embedding for profile-aware query
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
              input: retrievalQuery,
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
    const userProfileBundle = await profilePromise;
    const userFirstName = await firstNamePromise;
    const nameDirective = userFirstName
      ? `The user's first name is ${userFirstName}. Address them by name occasionally where it feels natural — not in every response, and never in formal/legal answers.\n\n`
      : '';
    let fullSystemInstruction = preprompt
      ? `${nameDirective}${preprompt}\n\n${systemInstruction}`
      : `${nameDirective}${systemInstruction}`;
    if (userProfileBundle.text) {
      fullSystemInstruction = `${fullSystemInstruction}\n\n${userProfileBundle.text}`;
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
    console.log('- Streaming:', isStreaming);

    // ========================================================================
    // STEP 5a: STREAMING BRANCH
    // ========================================================================
    // When the client opts in via `stream: true`, return a text/event-stream
    // response. We emit:
    //   event: metadata    — sources/queryType/disclaimer/lastVerified
    //   event: token       — incremental delta from OpenRouter
    //   event: complete    — final cleanAnswer + suggestions + token usage
    //
    // Token tracking, PostHog capture, and chatbot_usage persistence still
    // run server-side at completion using the FINAL accumulated answer.
    // The non-streaming path below is unchanged so the eval harness keeps
    // working.
    if (isStreaming) {
      // Propagated into callOpenRouterStream and triggered when the client
      // disconnects mid-stream. Without this, the upstream OpenRouter SSE
      // keeps draining tokens that nobody sees — pure cost leak.
      const upstreamAbort = new AbortController();

      const streamResult = await callOpenRouterStream({
        messages: messagesForLlm,
        maxTokens: 1200,
        timeoutMs: 25000,
        retries: 1,
        retryDelayMs: 500,
        appName: 'Unify — AI Companion',
        signal: upstreamAbort.signal,
      });

      if (!streamResult.ok) {
        if (streamResult.retryable) {
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
        console.error(
          'OpenRouter streaming call failed:',
          streamResult.message
        );
        throw new Error(streamResult.message);
      }

      const generationStartedAt = performance.now();
      const encoder = new TextEncoder();

      const sse = (event: string, payload: unknown): Uint8Array =>
        encoder.encode(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`);

      // Set true when controller.enqueue throws (client closed connection)
      // OR when the ReadableStream `cancel` hook fires. Used to abort the
      // upstream OpenRouter fetch and to skip post-stream PostHog capture
      // and chatbot_usage persistence — we don't bill or analytics-log a
      // half-consumed answer the user never saw.
      let clientDisconnected = false;

      const responseStream = new ReadableStream<Uint8Array>({
        async start(controller) {
          let accumulatedAnswer = '';
          let finalUsage:
            | {
                promptTokens: number;
                completionTokens: number;
                totalTokens: number;
                costUsd?: number;
              }
            | undefined;
          let resolvedModel: string | undefined;
          let resolvedProvider: string | undefined;

          // controller.enqueue throws TypeError once the stream has been
          // canceled (client disconnect, RN unmount). Catch, mark disconnected,
          // abort upstream so OpenRouter stops draining tokens.
          const safeEnqueue = (bytes: Uint8Array): boolean => {
            try {
              controller.enqueue(bytes);
              return true;
            } catch {
              clientDisconnected = true;
              upstreamAbort.abort();
              return false;
            }
          };

          try {
            // Emit metadata first so the client can render sources / disclaimer
            // alongside the empty bot bubble before any tokens arrive.
            if (
              !safeEnqueue(
                sse('metadata', {
                  sources: sources.length > 0 ? sources : undefined,
                  queryType,
                  disclaimer,
                  lastVerified: lastVerified || undefined,
                })
              )
            ) {
              return;
            }

            for await (const chunk of streamResult.stream) {
              if (clientDisconnected) break;
              if (chunk.delta) {
                accumulatedAnswer += chunk.delta;
                if (!safeEnqueue(sse('token', { delta: chunk.delta }))) break;
              }
              if (chunk.usage) finalUsage = chunk.usage;
              if (chunk.model) resolvedModel = chunk.model;
              if (chunk.provider) resolvedProvider = chunk.provider;
            }

            // If the client dropped mid-stream, skip everything below: we
            // don't bill, don't capture analytics, don't emit `complete`.
            if (clientDisconnected) {
              logStageTimings('error');
              return;
            }

            stageTimings.generation_ms = Math.round(
              performance.now() - generationStartedAt
            );

            const rawAnswer =
              accumulatedAnswer || 'Sorry, I could not generate a response.';
            const tokenUsage = {
              prompt_tokens: finalUsage?.promptTokens ?? 0,
              completion_tokens: finalUsage?.completionTokens ?? 0,
              total_tokens: finalUsage?.totalTokens ?? 0,
            };
            const estimatedCostUsd = finalUsage?.costUsd;

            // PostHog $ai_generation capture — same shape as non-streaming.
            // $ai_input includes the full multi-turn conversation (last 10
            // turns from conversationHistory + the current user prompt) so
            // LLM trace UI and eval mining can reconstruct context. System
            // prompt and RAG context are excluded — they're constants per
            // queryType and would balloon event payload.
            if (!isEvalMode) {
              captureAiGeneration(effectiveUserId, {
                $ai_model: resolvedModel ?? 'unknown',
                $ai_provider: resolvedProvider ?? 'unknown',
                $ai_input_tokens: tokenUsage.prompt_tokens,
                $ai_output_tokens: tokenUsage.completion_tokens,
                $ai_total_tokens: tokenUsage.total_tokens,
                $ai_total_cost_usd: estimatedCostUsd,
                $ai_trace_id: conversationIdentifier || undefined,
                $ai_input: [
                  ...conversationHistory,
                  { role: 'user', content: prompt },
                ],
                $ai_output_choices: [
                  { role: 'assistant', content: rawAnswer },
                ],
                feature: 'ai_companion',
                query_type: queryType,
                has_sources: sources.length > 0,
                response_time_ms: stageTimings.generation_ms,
              });
            }

            if (
              !isEvalMode &&
              effectiveUserId &&
              tokenUsage.total_tokens > 0
            ) {
              scheduleBackgroundTask(
                persistChatbotUsage(
                  supabase,
                  effectiveUserId,
                  tokenUsage,
                  estimatedCostUsd
                )
              );
            }

            const { cleanAnswer, suggestions } =
              parseSuggestionsFromResponse(rawAnswer);

            safeEnqueue(
              sse('complete', {
                cleanAnswer,
                suggestedNextSteps:
                  suggestions.length > 0 ? suggestions : undefined,
                tokenUsage,
                estimatedCostUsd,
                model: resolvedModel,
                provider: resolvedProvider,
              })
            );

            logStageTimings('success');
          } catch (streamErr) {
            // Distinguish a real upstream/parse error from an abort triggered
            // by client disconnect. AbortError is the expected control-flow
            // signal when upstreamAbort.abort() fires from cancel/safeEnqueue.
            const isAbort =
              streamErr instanceof DOMException &&
              streamErr.name === 'AbortError';
            if (isAbort && clientDisconnected) {
              logStageTimings('error');
              return;
            }
            console.error('Streaming generation failed:', streamErr);
            safeEnqueue(
              sse('error', {
                error:
                  streamErr instanceof Error
                    ? streamErr.message
                    : 'Streaming failed',
              })
            );
            logStageTimings('error');
          } finally {
            try {
              controller.close();
            } catch {
              // already closed
            }
          }
        },
        // Fires when the consumer (Deno HTTP server / client connection)
        // cancels the stream — e.g. RN client unmount, network drop. Abort
        // the upstream OpenRouter fetch so we stop billing for tokens nobody
        // will see. The for-await loop in start() exits via AbortError, then
        // skips the post-stream PostHog/persist work via clientDisconnected.
        cancel(_reason) {
          clientDisconnected = true;
          upstreamAbort.abort();
        },
      });

      return new Response(responseStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
          // Disable proxy buffering (nginx/cloudflare) so tokens flush immediately.
          'x-accel-buffering': 'no',
        },
      });
    }

    // ========================================================================
    // STEP 5b: NON-STREAMING (eval harness + backwards-compat)
    // ========================================================================
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
    // Skipped in eval mode so regression runs don't pollute prod analytics.
    if (!isEvalMode) {
      captureAiGeneration(effectiveUserId, {
        $ai_model: llmResult.model,
        $ai_provider: llmResult.provider,
        $ai_input_tokens: tokenUsage.prompt_tokens,
        $ai_output_tokens: tokenUsage.completion_tokens,
        $ai_total_tokens: tokenUsage.total_tokens,
        $ai_total_cost_usd: estimatedCostUsd,
        $ai_trace_id: conversationIdentifier || undefined,
        // Full multi-turn conversation for LLM trace UI + eval mining
        // (last 10 turns + the current user prompt). Excludes the system
        // prompt and RAG context — constants per queryType, would balloon
        // event payload.
        $ai_input: [
          ...conversationHistory,
          { role: 'user', content: prompt },
        ],
        $ai_output_choices: [{ role: 'assistant', content: rawAnswer }],
        // Custom properties for filtering
        feature: 'ai_companion',
        query_type: queryType,
        has_sources: sources.length > 0,
        response_time_ms: stageTimings.generation_ms,
      });
    }

    // Store token usage outside the response critical path.
    if (!isEvalMode && effectiveUserId && tokenUsage.total_tokens > 0) {
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
