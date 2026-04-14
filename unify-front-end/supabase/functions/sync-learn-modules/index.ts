// @ts-ignore JSR import
import { createClient } from 'jsr:@supabase/supabase-js@2';

/**
 * Weekly / manual full sync: Sanity → learn_modules (upsert + delete orphans).
 *
 * Secrets (Supabase Dashboard → Edge Functions):
 *   SANITY_PROJECT_ID, SANITY_DATASET (optional), SANITY_API_TOKEN
 *   SYNC_LEARN_MODULES_API_KEY — required; callers send x-api-key header
 *
 * Cron: pg_cron → trigger_sync_learn_modules() (see migration).
 */

const JSON_HEADERS = { 'Content-Type': 'application/json' };

interface SanityModuleRow {
  sanity_id: string;
  title: string;
  personas: string[];
  interests: string[];
  goals: string[];
  province: string | null;
  difficulty: string | null;
  synced_at: string;
}

async function fetchAllModulesFromSanity(): Promise<SanityModuleRow[]> {
  const projectId = Deno.env.get('SANITY_PROJECT_ID');
  const dataset = Deno.env.get('SANITY_DATASET') || 'production';
  const token = Deno.env.get('SANITY_API_TOKEN');

  if (!projectId || !token) {
    throw new Error('Missing SANITY_PROJECT_ID or SANITY_API_TOKEN');
  }

  const query = encodeURIComponent(
    `*[_type == "module"] {
      _id,
      title,
      "personas": coalesce(personas, []),
      "interests": coalesce(interests, []),
      "goals": coalesce(goals, []),
      province,
      difficulty
    }`
  );

  const url = `https://${projectId}.api.sanity.io/v2023-08-01/data/query/${dataset}?query=${query}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });

  if (!res.ok) {
    throw new Error(`Sanity fetch failed: ${res.status} ${await res.text()}`);
  }

  const json = (await res.json()) as { result: Record<string, unknown>[] };
  const now = new Date().toISOString();

  return (json.result || []).map(doc => ({
    sanity_id: doc._id as string,
    title: doc.title as string,
    personas: (doc.personas as string[]) || [],
    interests: (doc.interests as string[]) || [],
    goals: (doc.goals as string[]) || [],
    province: (doc.province as string | null) ?? null,
    difficulty: (doc.difficulty as string | null) ?? null,
    synced_at: now,
  }));
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: JSON_HEADERS,
    });
  }

  const apiKey = Deno.env.get('SYNC_LEARN_MODULES_API_KEY');
  if (!apiKey) {
    console.error('sync-learn-modules: SYNC_LEARN_MODULES_API_KEY not configured');
    return new Response(JSON.stringify({ error: 'Server misconfigured' }), {
      status: 500,
      headers: JSON_HEADERS,
    });
  }
  if (req.headers.get('x-api-key') !== apiKey) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: JSON_HEADERS,
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: 'Server misconfigured' }), {
      status: 500,
      headers: JSON_HEADERS,
    });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  let sanityModules: SanityModuleRow[];
  try {
    sanityModules = await fetchAllModulesFromSanity();
  } catch (e) {
    console.error('sync-learn-modules: sanity fetch error', e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: JSON_HEADERS,
    });
  }

  const { data: existing, error: fetchErr } = await supabase
    .from('learn_modules')
    .select('sanity_id');

  if (fetchErr) {
    console.error('sync-learn-modules: fetch existing error', fetchErr);
    return new Response(JSON.stringify({ error: fetchErr.message }), {
      status: 500,
      headers: JSON_HEADERS,
    });
  }

  const existingIds = new Set(
    (existing || []).map((r: { sanity_id: string }) => r.sanity_id)
  );
  const incomingIds = new Set(sanityModules.map(m => m.sanity_id));

  let upserted = 0;
  if (sanityModules.length > 0) {
    const { error: upsertErr } = await supabase
      .from('learn_modules')
      .upsert(sanityModules, { onConflict: 'sanity_id' });
    if (upsertErr) {
      console.error('sync-learn-modules: upsert error', upsertErr);
      return new Response(JSON.stringify({ error: upsertErr.message }), {
        status: 500,
        headers: JSON_HEADERS,
      });
    }
    upserted = sanityModules.length;
  }

  const orphanedIds = [...existingIds].filter(id => !incomingIds.has(id));
  let deleted = 0;
  if (orphanedIds.length > 0) {
    const { error: deleteErr } = await supabase
      .from('learn_modules')
      .delete()
      .in('sanity_id', orphanedIds);
    if (deleteErr) {
      console.error('sync-learn-modules: delete orphans error', deleteErr);
    } else {
      deleted = orphanedIds.length;
      console.log(
        `sync-learn-modules: deleted ${deleted} orphaned rows`,
        orphanedIds
      );
    }
  }

  return new Response(JSON.stringify({ ok: true, upserted, deleted }), {
    status: 200,
    headers: JSON_HEADERS,
  });
});
