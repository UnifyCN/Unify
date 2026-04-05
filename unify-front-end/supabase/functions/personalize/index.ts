import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface OnboardingProfile {
  persona: string | null;
  persona_other: string | null;
  city: string | null;
  province: string | null;
  arrival_date: string | null;
  goals: string[];
  learning_interests: string[];
}

function buildCompanionStarters(profile: OnboardingProfile): string[] {
  const { persona, city, province, goals, learning_interests } = profile;

  const starters: string[] = [];

  function humanize(str: string): string {
    return str.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  // Persona + location starter
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

  // Goal-based starter
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

  // Interest-based starter
  if (learning_interests.length > 0) {
    const topInterest = learning_interests[0];
    starters.push(
      `What ${topInterest} opportunities are available for newcomers?`
    );
  }

  // Fill remaining slots with sensible fallbacks if we have fewer than 3
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

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Only serve companion surface for now
    const url = new URL(req.url);
    const surfaces = url.searchParams.get('surfaces') ?? '';
    if (!surfaces.includes('companion')) {
      return new Response(JSON.stringify({ companion: null }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Authenticate the request using the JWT from the Authorization header
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

    // Get authenticated user from the JWT — profile data is never sent from client
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

    // Read onboarding profile from DB
    const { data: profileData, error: profileError } = await supabaseClient
      .from('user_onboarding_profiles')
      .select(
        'persona, persona_other, city, province, arrival_date, goals, learning_interests'
      )
      .eq('id', user.id)
      .maybeSingle();

    // If no profile exists or fetch fails, return generic starters gracefully
    if (profileError || !profileData) {
      return new Response(JSON.stringify({ companion: null }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const profile: OnboardingProfile = {
      persona: profileData.persona ?? null,
      persona_other: profileData.persona_other ?? null,
      city: profileData.city ?? null,
      province: profileData.province ?? null,
      arrival_date: profileData.arrival_date ?? null,
      goals: profileData.goals ?? [],
      learning_interests: profileData.learning_interests ?? [],
    };

    const starters = buildCompanionStarters(profile);

    const responseBody = {
      companion: {
        context: {
          persona: profile.persona,
          city: profile.city,
          province: profile.province,
          arrival_date: profile.arrival_date,
          goals: profile.goals,
          interests: profile.learning_interests,
        },
        starters,
      },
    };

    return new Response(JSON.stringify(responseBody), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('personalize edge function error:', error);
    // Never crash the client — return null so fallback kicks in
    return new Response(JSON.stringify({ companion: null }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
