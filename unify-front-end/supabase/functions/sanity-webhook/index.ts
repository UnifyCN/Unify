// @ts-ignore JSR import
import { createClient } from 'jsr:@supabase/supabase-js@2';

/**
 * Sanity Webhook → learn_modules sync
 *
 * Configure in Sanity: Settings → API → Webhooks
 *   URL:     <SUPABASE_URL>/functions/v1/sanity-webhook
 *   Dataset: production
 *   Filter:  _type == "module"
 *   HTTP method: POST
 *   Secret header: x-sanity-webhook-secret: <SANITY_WEBHOOK_SECRET>
 *   Projections / payload: full document
 *
 * On each publish the webhook fires with the full module document.
 * We upsert the row in learn_modules using service-role so RLS is bypassed.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-sanity-webhook-secret',
};

interface SanityModulePayload {
  _id: string;
  _type: string;
  title?: string;
  personas?: string[];
  interests?: string[];
  goals?: string[];
  province?: string;
  difficulty?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Verify webhook secret
  const webhookSecret = Deno.env.get('SANITY_WEBHOOK_SECRET');
  if (webhookSecret) {
    const incomingSecret = req.headers.get('x-sanity-webhook-secret');
    if (incomingSecret !== webhookSecret) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: 'Server misconfigured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let payload: SanityModulePayload;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Only process module documents
  if (payload._type !== 'module') {
    return new Response(JSON.stringify({ ok: true, skipped: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!payload._id || !payload.title) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields: _id, title' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { error } = await supabase.from('learn_modules').upsert(
    {
      sanity_id: payload._id,
      title: payload.title,
      personas: payload.personas ?? [],
      interests: payload.interests ?? [],
      goals: payload.goals ?? [],
      province: payload.province ?? null,
      difficulty: payload.difficulty ?? null,
      synced_at: new Date().toISOString(),
    },
    { onConflict: 'sanity_id' }
  );

  if (error) {
    console.error('sanity-webhook: upsert error', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  console.log(`sanity-webhook: upserted module ${payload._id} (${payload.title})`);

  return new Response(
    JSON.stringify({ ok: true, sanity_id: payload._id }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
