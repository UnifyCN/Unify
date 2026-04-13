#!/usr/bin/env npx ts-node
/**
 * sync-sanity-modules
 *
 * Fallback weekly sync: fetches all modules from Sanity and does a full
 * diff-upsert into the learn_modules Supabase table.
 *   - Upserts new/changed rows
 *   - Deletes orphaned rows (modules removed from Sanity)
 *
 * Usage:
 *   npm run sync-sanity-modules
 *
 * Required env vars (from .env or shell):
 *   SANITY_PROJECT_ID
 *   SANITY_DATASET          (default: production)
 *   SANITY_API_TOKEN        (read token)
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load .env from project root
const envPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(envPath)) dotenv.config({ path: envPath });

const SANITY_PROJECT_ID = process.env.SANITY_PROJECT_ID;
const SANITY_DATASET = process.env.SANITY_DATASET || 'production';
const SANITY_API_TOKEN = process.env.SANITY_API_TOKEN;
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SANITY_PROJECT_ID || !SANITY_API_TOKEN) {
  console.error('[sync] Missing SANITY_PROJECT_ID or SANITY_API_TOKEN');
  process.exit(1);
}
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('[sync] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

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

  const url = `https://${SANITY_PROJECT_ID}.api.sanity.io/v2023-08-01/data/query/${SANITY_DATASET}?query=${query}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${SANITY_API_TOKEN}` },
  });

  if (!res.ok) {
    throw new Error(`Sanity fetch failed: ${res.status} ${await res.text()}`);
  }

  const json = await res.json() as { result: any[] };
  const now = new Date().toISOString();

  return (json.result || []).map((doc: any) => ({
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

async function main() {
  console.log('[sync] Fetching modules from Sanity…');
  const sanityModules = await fetchAllModulesFromSanity();
  console.log(`[sync] Got ${sanityModules.length} modules from Sanity`);

  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

  // Fetch existing IDs from Supabase
  const { data: existing, error: fetchErr } = await supabase
    .from('learn_modules')
    .select('sanity_id');

  if (fetchErr) {
    console.error('[sync] Failed to fetch existing modules:', fetchErr.message);
    process.exit(1);
  }

  const existingIds = new Set((existing || []).map((r: { sanity_id: string }) => r.sanity_id));
  const incomingIds = new Set(sanityModules.map(m => m.sanity_id));

  // Upsert all current Sanity modules
  if (sanityModules.length > 0) {
    const { error: upsertErr } = await supabase
      .from('learn_modules')
      .upsert(sanityModules, { onConflict: 'sanity_id' });

    if (upsertErr) {
      console.error('[sync] Upsert failed:', upsertErr.message);
      process.exit(1);
    }
    console.log(`[sync] Upserted ${sanityModules.length} rows`);
  }

  // Delete orphaned rows (in Supabase but not in Sanity anymore)
  const orphanedIds = [...existingIds].filter(id => !incomingIds.has(id));
  if (orphanedIds.length > 0) {
    const { error: deleteErr } = await supabase
      .from('learn_modules')
      .delete()
      .in('sanity_id', orphanedIds);

    if (deleteErr) {
      console.error('[sync] Delete orphans failed:', deleteErr.message);
    } else {
      console.log(`[sync] Deleted ${orphanedIds.length} orphaned row(s):`, orphanedIds);
    }
  }

  console.log('[sync] Done.');
}

main().catch(err => {
  console.error('[sync] Unexpected error:', err);
  process.exit(1);
});
