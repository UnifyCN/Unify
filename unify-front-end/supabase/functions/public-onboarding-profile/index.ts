import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const responseHeaders = {
  'Content-Type': 'application/json',
};

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: responseHeaders,
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !anonKey || !serviceKey) {
    return new Response(
      JSON.stringify({ error: 'Missing Supabase environment configuration' }),
      { status: 500, headers: responseHeaders }
    );
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: responseHeaders,
    });
  }

  try {
    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });
    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: responseHeaders,
      });
    }

    // Always scope to the authenticated caller. Previously this trusted
    // body.userId, which let any authenticated user read another user's
    // persona / arrival_date via the service-role client (horizontal IDOR).
    const adminClient = createClient(supabaseUrl, serviceKey);
    const { data, error } = await adminClient
      .from('user_onboarding_profiles')
      .select('persona, persona_other, arrival_date')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      return new Response(
        JSON.stringify({ error: `Failed to fetch profile: ${error.message}` }),
        { status: 500, headers: responseHeaders }
      );
    }

    return new Response(JSON.stringify({ profile: data ?? null }), {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: responseHeaders,
    });
  }
});
