// @ts-ignore JSR import
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface OnboardingProfile {
  persona: string | null;
  city: string | null;
  province: string | null;
  arrival_date: string | null;
  goals: string[];
  learning_interests: string[];
}

// ─── Companion surface ────────────────────────────────────────────────────────

function buildCompanionStarters(profile: OnboardingProfile): string[] {
  const { persona, city, province, goals, learning_interests } = profile;

  const starters: string[] = [];

  function humanize(str: string): string {
    return str.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  if (persona && city) {
    const personaLabel =
      persona === 'international_student'
        ? 'international student'
        : persona.replace(/_/g, ' ');
    starters.push(`What do I need to know as a ${personaLabel} in ${city}?`);
  } else if (persona) {
    const personaLabel = persona.replace(/_/g, ' ');
    starters.push(
      `What resources are available for a ${personaLabel} in Canada?`
    );
  }

  if (goals.length > 0) {
    const topGoal = goals[0];
    const location = city ?? province ?? 'Canada';

    if (
      topGoal.toLowerCase().includes('work') ||
      topGoal.toLowerCase().includes('job')
    ) {
      starters.push(`Help me find job opportunities in ${location}`);
    } else if (
      topGoal.toLowerCase().includes('english') ||
      topGoal.toLowerCase().includes('language')
    ) {
      starters.push(`What language programs are available in ${location}?`);
    } else if (topGoal.toLowerCase().includes('housing')) {
      starters.push(`How do I find housing as a newcomer in ${location}?`);
    } else {
      starters.push(
        `How do I achieve my goal to ${humanize(topGoal)} in ${location}?`
      );
    }
  }

  if (learning_interests.length > 0) {
    const topInterest = learning_interests[0];
    starters.push(
      `What ${topInterest} opportunities are available for newcomers?`
    );
  }

  const fallbacks = [
    'What are the most important steps after arriving in Canada?',
    'How does the Canadian healthcare system work?',
    'What free settlement services are available to me?',
  ];

  for (const fallback of fallbacks) {
    if (starters.length >= 3) break;
    starters.push(fallback);
  }

  return starters.slice(0, 3);
}

// ─── Learn surface ────────────────────────────────────────────────────────────

interface LearnModule {
  sanity_id: string;
  title: string;
  personas: string[];
  interests: string[];
  goals: string[];
  province: string | null;
  difficulty: string | null;
}

interface LearnProgressRow {
  module_id: string;
  status: 'not_started' | 'in_progress' | 'completed';
  completed_at: string | null;
}

interface ScoredModule {
  sanity_id: string;
  title: string;
  score: number;
  progress: 'not_started' | 'in_progress' | 'completed';
  completed_at: string | null;
  why_tag: string;
}

/**
 * Score a module against the user's profile.
 * Returns a value in [0, 1].
 *
 * Scoring breakdown (weights sum to 1.0):
 *   persona match   0.35
 *   interest match  0.30
 *   goal match      0.25
 *   province match  0.10
 */
function scoreModule(module: LearnModule, profile: OnboardingProfile): { score: number; why_tag: string } {
  let score = 0;
  let why_tag = '';

  // Persona match (0.35)
  if (profile.persona && module.personas.length > 0) {
    if (module.personas.includes(profile.persona)) {
      score += 0.35;
    }
  }

  // Interest match (0.30)
  const interestMatches = profile.learning_interests.filter(i =>
    module.interests.some(
      mi => mi.toLowerCase() === i.toLowerCase() || i.toLowerCase().includes(mi.toLowerCase())
    )
  );
  if (interestMatches.length > 0 && module.interests.length > 0) {
    score += 0.30 * Math.min(interestMatches.length / module.interests.length, 1);
  }

  // Goal match (0.25)
  const goalMatches = profile.goals.filter(g =>
    module.goals.some(
      mg => mg.toLowerCase() === g.toLowerCase() || g.toLowerCase().includes(mg.toLowerCase())
    )
  );
  if (goalMatches.length > 0 && module.goals.length > 0) {
    score += 0.25 * Math.min(goalMatches.length / module.goals.length, 1);
  }

  // Province match (0.10)
  if (profile.province && module.province) {
    if (module.province.toLowerCase() === profile.province.toLowerCase()) {
      score += 0.10;
    }
  } else if (!module.province) {
    // Province-agnostic modules get a small universal boost
    score += 0.05;
  }

  // Build why_tag from the strongest signal
  if (interestMatches.length > 0) {
    const interest = interestMatches[0].replace(/_/g, ' ');
    why_tag = `Matches your interest in ${interest}`;
  } else if (goalMatches.length > 0) {
    const goal = goalMatches[0].replace(/_/g, ' ');
    why_tag = `Supports your goal: ${goal}`;
  } else if (profile.persona && module.personas.includes(profile.persona ?? '')) {
    const p = (profile.persona ?? '').replace(/_/g, ' ');
    why_tag = `Recommended for ${p}`;
  } else if (profile.province && module.province === profile.province) {
    why_tag = `Recommended for newcomers in ${profile.province}`;
  } else {
    why_tag = 'Recommended for newcomers';
  }

  return { score: Math.min(score, 1), why_tag };
}

async function buildLearnSurface(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  profile: OnboardingProfile
): Promise<{ modules: ScoredModule[] }> {
  // Fetch all modules metadata
  const { data: modules, error: modulesErr } = await supabase
    .from('learn_modules')
    .select('sanity_id, title, personas, interests, goals, province, difficulty');

  if (modulesErr) {
    console.error('personalize/learn: modules fetch error', modulesErr);
    return { modules: [] };
  }

  // Fetch user's progress for all modules
  const { data: progressRows } = await supabase
    .from('learn_progress')
    .select('module_id, status, completed_at')
    .eq('user_id', userId);

  const progressByModule = new Map<string, LearnProgressRow>();
  for (const row of (progressRows as LearnProgressRow[]) ?? []) {
    progressByModule.set(row.module_id, row);
  }

  // Score and sort
  const scored: ScoredModule[] = ((modules as LearnModule[]) ?? []).map(m => {
    const { score, why_tag } = scoreModule(m, profile);
    const progress = progressByModule.get(m.sanity_id);
    return {
      sanity_id: m.sanity_id,
      title: m.title,
      score: Math.round(score * 100) / 100,
      progress: progress?.status ?? 'not_started',
      completed_at: progress?.completed_at ?? null,
      why_tag,
    };
  });

  // Completed modules sink to the bottom; within each group, sort by score desc
  scored.sort((a, b) => {
    const aCompleted = a.progress === 'completed' ? 1 : 0;
    const bCompleted = b.progress === 'completed' ? 1 : 0;
    if (aCompleted !== bCompleted) return aCompleted - bCompleted;
    return b.score - a.score;
  });

  return { modules: scored };
}

// ─── Handler ──────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const surfaces = url.searchParams.get('surfaces') ?? '';
    const wantsCompanion = surfaces.includes('companion');
    const wantsLearn = surfaces.includes('learn');

    if (!wantsCompanion && !wantsLearn) {
      return new Response(JSON.stringify({ companion: null, learn: null }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: profileData, error: profileError } = await supabaseClient
      .from('user_onboarding_profiles')
      .select(
        'persona, city, province, arrival_date, goals, learning_interests'
      )
      .eq('id', user.id)
      .maybeSingle();

    if (profileError || !profileData) {
      // No profile — return null surfaces so the app falls back gracefully
      return new Response(
        JSON.stringify({ companion: null, learn: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const profile: OnboardingProfile = {
      persona: profileData.persona ?? null,
      city: profileData.city ?? null,
      province: profileData.province ?? null,
      arrival_date: profileData.arrival_date ?? null,
      goals: profileData.goals ?? [],
      learning_interests: profileData.learning_interests ?? [],
    };

    const responseBody: Record<string, unknown> = {};

    if (wantsCompanion) {
      responseBody.companion = {
        context: {
          persona: profile.persona,
          city: profile.city,
          province: profile.province,
          arrival_date: profile.arrival_date,
          goals: profile.goals,
          interests: profile.learning_interests,
        },
        starters: buildCompanionStarters(profile),
      };
    }

    if (wantsLearn) {
      responseBody.learn = await buildLearnSurface(
        supabaseClient,
        user.id,
        profile
      );
    }

    return new Response(JSON.stringify(responseBody), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('personalize edge function error:', error);
    return new Response(
      JSON.stringify({ companion: null, learn: null }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
