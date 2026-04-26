import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

// ============================================================================
// CONFIG
// ============================================================================

const GEMINI_MODEL = Deno.env.get('GEMINI_MODEL') || 'gemini-2.5-flash';

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

const GOAL_LABELS: Record<string, string> = {
  learn_something: 'learning about life in Canada',
  build_community: 'building community and connections',
  quick_answers: 'getting quick answers to questions',
  something_else: 'general newcomer support',
};

const INTEREST_LABELS: Record<string, string> = {
  documents: 'documents & paperwork',
  employment: 'employment & job search',
  finance: 'finance & banking',
  housing: 'housing & renting',
  pr_immigration: 'PR & immigration pathways',
  healthcare: 'healthcare & insurance',
  family_kids: 'family & kids',
  transit: 'transit & transportation',
  other: 'other topics',
};

const VALID_CATEGORIES = [
  'documents',
  'finance',
  'housing',
  'employment',
  'healthcare',
  'immigration',
  'settlement',
  'general',
];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

// ============================================================================
// GEMINI TIP GENERATION
// ============================================================================

interface GeneratedTip {
  category: string;
  title: string;
  description: string;
  tip_text: string;
}

interface UserProfile {
  persona: string;
  stage: string;
  city: string | null;
  province: string | null;
  goals: string[];
  learning_interests: string[];
  arrival_date: string | null;
}

function buildGeminiPrompt(profile: UserProfile, date: string): string {
  const personaDesc =
    PERSONA_DESCRIPTIONS[profile.persona] || 'newcomer to Canada';
  const stageDesc = STAGE_DESCRIPTIONS[profile.stage] || 'newcomer';

  // Build location string
  let locationLine = '';
  if (profile.city && profile.province) {
    locationLine = `- Location: ${profile.city}, ${profile.province}`;
  } else if (profile.province) {
    locationLine = `- Location: ${profile.province}`;
  }

  // Build goals string
  const goalLabels = (profile.goals || [])
    .map(g => GOAL_LABELS[g] || g)
    .filter(Boolean);
  const goalsLine =
    goalLabels.length > 0 ? `- Goals: ${goalLabels.join(', ')}` : '';

  // Build interests string
  const interestLabels = (profile.learning_interests || [])
    .map(i => INTEREST_LABELS[i] || i)
    .filter(Boolean);
  const interestsLine =
    interestLabels.length > 0
      ? `- Interested in: ${interestLabels.join(', ')}`
      : '';

  // Build arrival context
  let arrivalLine = '';
  if (profile.arrival_date) {
    const arrival = new Date(profile.arrival_date);
    const now = new Date(date);
    const monthsInCanada = Math.max(
      0,
      Math.round(
        (now.getTime() - arrival.getTime()) / (1000 * 60 * 60 * 24 * 30)
      )
    );
    if (monthsInCanada <= 0) {
      arrivalLine = '- Has not yet arrived in Canada';
    } else {
      arrivalLine = `- Has been in Canada for approximately ${monthsInCanada} month${monthsInCanada === 1 ? '' : 's'}`;
    }
  }

  const profileLines = [
    `- Persona: ${personaDesc}`,
    `- Stage: ${stageDesc}`,
    locationLine,
    arrivalLine,
    goalsLine,
    interestsLine,
  ]
    .filter(Boolean)
    .join('\n');

  return `You are generating a daily tip for newcomers to Canada.

USER PROFILE:
${profileLines}
- Time context: ${date}

Generate a single, specific, actionable tip that is highly relevant to this user's situation, location, and interests. Respond ONLY with valid JSON (no markdown, no code fences):
{
  "category": "documents|finance|housing|employment|healthcare|immigration|settlement|general",
  "title": "short title (max 60 chars)",
  "description": "one-line summary (max 80 chars)",
  "tip_text": "the full tip, specific and actionable (max 200 chars)"
}

RULES:
- Be specific to this user's persona, stage, location, and interests
- If the user is in a specific city/province, reference local resources, programs, or services available there
- Prioritize topics the user has expressed interest in
- Reference real Canadian programs, services, or resources when possible
- No legal advice — use "generally" or "typically"
- No eligibility determinations
- Keep it actionable — tell them what to DO, not just what to know
- Vary the category day-to-day — do not always pick the same topic`;
}

function parseGeminiTipResponse(rawText: string): GeneratedTip | null {
  try {
    let cleaned = rawText.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
    }

    const parsed = JSON.parse(cleaned);

    if (
      !parsed.category ||
      !parsed.title ||
      !parsed.description ||
      !parsed.tip_text
    ) {
      console.error('Missing required fields in tip response');
      return null;
    }

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
    console.error(
      'Failed to parse tip JSON:',
      error,
      'Raw:',
      rawText.slice(0, 300)
    );
    return null;
  }
}

async function callGemini(
  prompt: string,
  geminiApiKey: string
): Promise<string | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 300, temperature: 0.8 },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
  } catch (error) {
    console.error('Gemini call failed:', error);
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: 'Missing Supabase env vars' }, 500);
  }

  const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
  if (!geminiApiKey) {
    return jsonResponse({ error: 'Missing GEMINI_API_KEY' }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // 1. Validate auth
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const { data: authData, error: authError } =
      await supabase.auth.getUser(token);
    if (authError || !authData?.user) {
      return jsonResponse({ error: 'Invalid user' }, 401);
    }

    // 2. Get user's onboarding profile
    const { data: profile, error: profileError } = await supabase
      .from('user_onboarding_profiles')
      .select(
        'persona, stage, city, province, goals, learning_interests, arrival_date'
      )
      .eq('id', authData.user.id)
      .maybeSingle();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return jsonResponse({ error: 'Failed to fetch profile' }, 500);
    }

    const persona: string = profile?.persona || 'other';
    const stage: string = profile?.stage || '0';
    const today = new Date().toISOString().split('T')[0];

    const userId = authData.user.id;

    // 3. Check if today's tip already exists for this user.
    // Race protection: two concurrent requests (e.g. pull-to-refresh + tab
    // focus) would otherwise BOTH call Gemini and burn tokens. We solve this
    // by inserting a `__pending__` placeholder before calling Gemini; the
    // unique index on (user_id, date) makes that an atomic claim.
    const PENDING = '__pending__';
    const STALE_PENDING_MS = 60_000; // a crashed run leaves a stale placeholder; treat as abandoned after this

    const respondWithTip = (row: {
      id: string;
      persona: string;
      stage: string;
      date: string;
      category: string;
      title: string;
      description: string;
      tip_text: string;
      source_refs: unknown;
    }) =>
      jsonResponse({
        tip: {
          id: row.id,
          persona: row.persona,
          stage: row.stage,
          date: row.date,
          category: row.category,
          title: row.title,
          description: row.description,
          tip_text: row.tip_text,
          source_refs: row.source_refs,
        },
      });

    const pollForCompletion = async () => {
      for (let attempt = 0; attempt < 20; attempt++) {
        await new Promise(r => setTimeout(r, 250));
        const { data: row } = await supabase
          .from('daily_tips')
          .select('*')
          .eq('user_id', userId)
          .eq('date', today)
          .maybeSingle();
        if (row && row.title !== PENDING) {
          return respondWithTip(row);
        }
      }
      return jsonResponse(
        { error: 'Tip generation in progress, retry shortly' },
        503
      );
    };

    const { data: existingTip, error: fetchError } = await supabase
      .from('daily_tips')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle();

    if (fetchError) {
      console.error('Tip fetch error:', fetchError);
      return jsonResponse({ error: 'Failed to fetch tip' }, 500);
    }

    if (existingTip && existingTip.title !== PENDING) {
      return respondWithTip(existingTip);
    }

    if (existingTip && existingTip.title === PENDING) {
      const ageMs =
        Date.now() - new Date(existingTip.created_at).getTime();
      if (ageMs > STALE_PENDING_MS) {
        // Crashed previous run left a stale placeholder — clear it and re-claim.
        await supabase.from('daily_tips').delete().eq('id', existingTip.id);
      } else {
        // Fresh placeholder from another in-flight request — poll for completion.
        return await pollForCompletion();
      }
    }

    // 4. Insert claim. ON CONFLICT (user_id, date) returns 23505.
    const { data: claim, error: claimError } = await supabase
      .from('daily_tips')
      .insert({
        user_id: userId,
        persona,
        stage,
        date: today,
        category: PENDING,
        title: PENDING,
        description: PENDING,
        tip_text: PENDING,
        source_refs: null,
      })
      .select('id')
      .maybeSingle();

    const claimErrorCode = (claimError as { code?: string } | null)?.code;
    const isUniqueConflict = claimErrorCode === '23505';

    if (claimError && !isUniqueConflict) {
      console.error('Daily tip claim failed:', claimError);
      return jsonResponse({ error: 'Failed to claim tip slot' }, 500);
    }

    if (isUniqueConflict || !claim) {
      // Lost the claim race to another concurrent request. Poll for its result.
      return await pollForCompletion();
    }

    // We won the claim — generate via Gemini.
    const userProfile: UserProfile = {
      persona,
      stage,
      city: profile?.city || null,
      province: profile?.province || null,
      goals: profile?.goals || [],
      learning_interests: profile?.learning_interests || [],
      arrival_date: profile?.arrival_date || null,
    };
    const prompt = buildGeminiPrompt(userProfile, today);
    let rawText = await callGemini(prompt, geminiApiKey);
    let tip = rawText ? parseGeminiTipResponse(rawText) : null;

    // Retry once on failure
    if (!tip) {
      console.warn(
        `[${persona}/${stage}] First attempt failed, retrying once`
      );
      rawText = await callGemini(prompt, geminiApiKey);
      tip = rawText ? parseGeminiTipResponse(rawText) : null;
    }

    if (!tip) {
      // Roll back the claim so a future request can retry.
      await supabase.from('daily_tips').delete().eq('id', claim!.id);
      return jsonResponse({ error: 'Failed to generate tip' }, 502);
    }

    // 5. Replace placeholder with the real content.
    const { data: inserted, error: updateError } = await supabase
      .from('daily_tips')
      .update({
        category: tip.category,
        title: tip.title,
        description: tip.description,
        tip_text: tip.tip_text,
        source_refs: null,
      })
      .eq('id', claim!.id)
      .select()
      .single();

    if (updateError) {
      console.error('DB update error:', updateError);
      // Return the generated tip even if storage update failed.
      return jsonResponse({
        tip: {
          id: claim!.id,
          persona,
          stage,
          date: today,
          category: tip.category,
          title: tip.title,
          description: tip.description,
          tip_text: tip.tip_text,
          source_refs: null,
        },
      });
    }

    console.log(
      `[${persona}/${stage}] Generated tip on demand: "${tip.title}" (${tip.category})`
    );

    return jsonResponse({
      tip: {
        id: inserted.id,
        persona: inserted.persona,
        stage: inserted.stage,
        date: inserted.date,
        category: inserted.category,
        title: inserted.title,
        description: inserted.description,
        tip_text: inserted.tip_text,
        source_refs: inserted.source_refs,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return jsonResponse({ error: 'Request timed out' }, 504);
    }
    console.error('get-daily-tip error:', error);
    return jsonResponse({ error: 'Internal server error' }, 500);
  }
});
