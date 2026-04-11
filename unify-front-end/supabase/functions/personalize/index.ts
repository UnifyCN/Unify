// deno-lint-ignore-file
// @ts-ignore Deno edge runtime + JSR imports are not resolved by workspace TypeScript.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
// @ts-ignore JSR import
import { createClient } from 'jsr:@supabase/supabase-js@2';

const POSTHOG_HOST = Deno.env.get('POSTHOG_HOST') ?? 'https://us.i.posthog.com';
const FLAG_KEY = 'personalization_enabled';

const W = {
  persona: 0.30,
  location: 0.25,
  interest: 0.20,
  goal: 0.15,
  temporal: 0.05,
  priority_boost: 0.05,
} as const;

const SCORE_FLOOR = 0.1;
const RE_PERSONALIZE_MS = 90 * 86_400_000;

type Surface = 'checklist' | 'learn' | 'groups' | 'companion';

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: CORS_HEADERS });
}

function parseSurfaces(url: string): Set<Surface> | null {
  const raw = new URL(url).searchParams.get('surfaces');
  if (!raw?.trim()) return null;
  const parts = raw
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);
  const allowed: Surface[] = ['checklist', 'learn', 'groups', 'companion'];
  const set = new Set<Surface>();
  for (const p of parts) {
    if (allowed.includes(p as Surface)) set.add(p as Surface);
  }
  return set.size > 0 ? set : null;
}

function normalizeKey(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, '_');
}

function personaVariants(persona: string | null | undefined): string[] {
  if (!persona) return [];
  const p = persona.trim();
  if (!p) return [];
  const snake = normalizeKey(p);
  const title = p
    .split(/[_\s]+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
  return Array.from(new Set([p, snake, title]));
}

function personaDisplayLabel(persona: string | null | undefined): string {
  if (!persona) return 'newcomers';
  return String(persona).replace(/_/g, ' ');
}

async function isPersonalizationEnabled(distinctId: string): Promise<boolean> {
  const apiKey = Deno.env.get('POSTHOG_API_KEY');
  if (!apiKey) {
    console.warn('POSTHOG_API_KEY missing — treating personalization as OFF');
    return false;
  }
  try {
    const res = await fetch(`${POSTHOG_HOST}/decide?v=4`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: apiKey, distinct_id: distinctId }),
      signal: AbortSignal.timeout(450),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as {
      featureFlags?: Record<string, string | boolean>;
    };
    const flags = data.featureFlags ?? {};
    const v = flags[FLAG_KEY];
    if (v === true || v === 'true') return true;
    if (typeof v === 'string' && v !== 'false' && v !== '') return true;
    return false;
  } catch {
    return false;
  }
}

function overlapRatio(
  itemTags: string[] | null | undefined,
  userTags: string[] | null | undefined
): number {
  const items = itemTags ?? [];
  const users = userTags ?? [];
  if (!items.length || !users.length) return 0;
  const userSet = new Set(users.map(normalizeKey));
  let hit = 0;
  for (const t of items) {
    if (userSet.has(normalizeKey(t))) hit++;
  }
  return hit / items.length;
}

function personaMatch(
  itemPersona: string | null | undefined,
  userPersona: string | null | undefined
): number {
  const ip = (itemPersona ?? '').trim().toLowerCase();
  if (!ip || ip === 'all') return 0.3;
  if (!userPersona) return 0.3;
  const variants = new Set(personaVariants(userPersona).map(v => v.toLowerCase()));
  if (variants.has(ip)) return 1;
  if (variants.has(ip.replace(/_/g, ' '))) return 1;
  return 0;
}

function personaMatchFromList(
  personas: string[] | null | undefined,
  userPersona: string | null | undefined
): number {
  if (!personas?.length) return 0.3;
  const lower = personas
    .map(p => String(p).trim().toLowerCase())
    .filter(p => p.length > 0);
  if (!lower.length) return 0.3;
  if (lower.some(p => p === 'all')) return 0.3;
  if (!userPersona) return 0.3;
  const variants = new Set(personaVariants(userPersona).map(v => v.toLowerCase()));
  for (const p of lower) {
    if (variants.has(p) || variants.has(p.replace(/_/g, ' '))) return 1;
  }
  return 0;
}

function locationMatch(
  itemProvince: string | null | undefined,
  userProvince: string | null | undefined
): number {
  if (itemProvince == null || String(itemProvince).trim() === '') return 0.3;
  if (!userProvince || String(userProvince).trim() === '') return 0.3;
  if (normalizeKey(String(itemProvince)) === normalizeKey(String(userProvince)))
    return 1;
  return 0;
}

function daysSinceArrival(arrivalIso: string | null | undefined): number | null {
  if (!arrivalIso) return null;
  const t = new Date(arrivalIso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.floor((Date.now() - t) / 86_400_000);
}

function inMonthWindow(
  monthStart: number | null | undefined,
  monthEnd: number | null | undefined
): boolean | null {
  if (monthStart == null || monthEnd == null) return null;
  const m = new Date().getUTCMonth() + 1;
  if (monthStart <= monthEnd) return m >= monthStart && m <= monthEnd;
  return m >= monthStart || m <= monthEnd;
}

function temporalRelevance(
  row: Record<string, unknown>,
  arrivalIso: string | null | undefined
): number {
  const seasonal = inMonthWindow(
    row.month_start as number | null | undefined,
    row.month_end as number | null | undefined
  );
  if (seasonal === false) return 0;

  const showAfter = row.show_after_days as number | null | undefined;
  const showBefore = row.show_before_days as number | null | undefined;
  if (showAfter == null && showBefore == null) return 1;

  const days = daysSinceArrival(arrivalIso);
  if (days === null) return 0.5;

  let inWin = true;
  if (showAfter != null && days < showAfter) inWin = false;
  if (showBefore != null && days > showBefore) inWin = false;
  if (inWin) return 1;

  const distToWindow = Math.min(
    showAfter != null ? Math.abs(days - showAfter) : 9999,
    showBefore != null ? Math.abs(days - showBefore) : 9999
  );
  if (distToWindow <= 7) return 0.5;
  return 0;
}

function scoreContentItem(
  row: Record<string, unknown>,
  profile: ProfileRow,
  mode: 'checklist' | 'learn' | 'group'
): number {
  const userPersona = profile.persona as string | null | undefined;
  const userProvince = profile.province as string | null | undefined;
  const userGoals = (profile.goals as string[]) ?? [];
  const userInterests = (profile.learning_interests as string[]) ?? [];

  let pm: number;
  let itemProvince: string | null | undefined;
  let itemGoals: string[] | undefined;
  let itemInterests: string[] | undefined;

  if (mode === 'checklist') {
    pm = personaMatch(row.persona as string, userPersona);
    itemProvince = row.province as string | null | undefined;
    itemGoals = row.goals as string[] | null | undefined;
    itemInterests = row.interests as string[] | null | undefined;
  } else if (mode === 'learn') {
    pm = personaMatchFromList(row.personas as string[] | null, userPersona);
    itemProvince = row.province as string | null | undefined;
    itemGoals = row.goals as string[] | null | undefined;
    itemInterests = row.interests as string[] | null | undefined;
  } else {
    pm = 0.3;
    itemProvince = row.province as string | null | undefined;
    itemGoals = row.goals as string[] | null | undefined;
    itemInterests = row.interests as string[] | null | undefined;
  }

  const lm = locationMatch(itemProvince, userProvince);
  const im = overlapRatio(itemInterests, userInterests);
  const gm = overlapRatio(itemGoals, userGoals);
  const tm =
    mode === 'group' ? 1 : temporalRelevance(row, profile.arrival_date as string);

  // priority_boost: normalize recommendation_priority (0-100) to 0-1
  const rawPriority = Number(row.recommendation_priority ?? 0);
  const pb = Math.min(Math.max(rawPriority / 100, 0), 1);

  return (
    pm * W.persona +
    lm * W.location +
    im * W.interest +
    gm * W.goal +
    tm * W.temporal +
    pb * W.priority_boost
  );
}

function sortKeyCreatedAt(row: Record<string, unknown>): string {
  const c = row.created_at;
  return typeof c === 'string' ? c : '';
}

function compareRanked(
  a: { score: number; row: Record<string, unknown> },
  b: { score: number; row: Record<string, unknown> }
): number {
  if (b.score !== a.score) return b.score - a.score;
  const ta = sortKeyCreatedAt(a.row);
  const tb = sortKeyCreatedAt(b.row);
  if (tb !== ta) return tb.localeCompare(ta);
  const ida = a.row.id;
  const idb = b.row.id;
  if (typeof ida === 'number' && typeof idb === 'number') return idb - ida;
  return String(idb).localeCompare(String(ida));
}

type ProfileRow = Record<string, unknown>;

function whyTagChecklist(
  profile: ProfileRow,
  row: Record<string, unknown>
): string {
  const city = profile.city as string | undefined;
  const pl = personaDisplayLabel(profile.persona as string | undefined);
  const itemProvince = row.province as string | undefined;
  const itemGoals = row.goals as string[] | undefined;

  // Pick the strongest signal
  if (itemProvince && city) return `Recommended for ${pl} in ${city}`;
  if (itemGoals?.length) return `Matches your settlement goals`;
  if (profile.persona) return `Recommended for ${pl}`;
  return 'Popular with newcomers who share your goals';
}

function whyTagLearn(
  profile: ProfileRow,
  row: Record<string, unknown>
): string {
  const pl = personaDisplayLabel(profile.persona as string | undefined);
  const itemInterests = row.interests as string[] | undefined;
  const userInterests = (profile.learning_interests as string[]) ?? [];

  if (itemInterests?.length && userInterests.length) {
    const userSet = new Set(userInterests.map(normalizeKey));
    const match = itemInterests.find(i => userSet.has(normalizeKey(i)));
    if (match) return `Matches your interest in ${match.replace(/_/g, ' ')}`;
  }
  if (profile.persona) return `Popular with ${pl}`;
  return 'Popular with newcomers on Unify';
}

function whyTagGroup(profile: ProfileRow): string {
  const interests = (profile.learning_interests as string[]) ?? [];
  if (interests.length > 0) {
    const first = interests[0].replace(/_/g, ' ');
    return `Matches your interest in ${first}`;
  }
  return 'Suggested for your community journey';
}

async function fetchOnboardingProfile(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from('user_onboarding_profiles')
    .select(
      'persona, arrival_date, goals, learning_interests, hobbies, city, province, stage, updated_at'
    )
    .eq('id', userId)
    .maybeSingle();
  if (error) {
    console.error('profile fetch', error);
    return null;
  }
  return data as ProfileRow | null;
}

async function fetchChecklistRows(
  supabase: ReturnType<typeof createClient>,
  profile: ProfileRow | null
): Promise<Record<string, unknown>[]> {
  if (!profile?.persona || !profile?.stage) return [];
  const stage = String(profile.stage);
  const variants = personaVariants(profile.persona as string);
  // Include 'all' so tasks tagged for all personas are returned
  const personaFilter = Array.from(new Set([...variants, 'all', 'All']));
  const { data, error } = await supabase
    .from('personalized_checklist_tasks')
    .select('*')
    .eq('stage', stage)
    .in('persona', personaFilter);
  if (error) {
    console.error('checklist fetch', error);
    return [];
  }
  return (data ?? []) as Record<string, unknown>[];
}

async function fetchLearnRows(
  supabase: ReturnType<typeof createClient>
): Promise<Record<string, unknown>[]> {
  const { data, error } = await supabase.from('learn_modules').select('*');
  if (error) {
    if (
      error.message?.includes('learn_modules') ||
      error.code === '42P01' ||
      error.code === 'PGRST205'
    ) {
      console.warn('learn_modules unavailable:', error.message);
    } else {
      console.error('learn_modules', error);
    }
    return [];
  }
  return (data ?? []) as Record<string, unknown>[];
}

async function fetchGroupsAndMembership(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<{ groups: Record<string, unknown>[]; joined: Set<number> }> {
  const [memRes, grpRes] = await Promise.all([
    supabase.from('group_members').select('group_id').eq('user_id', userId),
    supabase
      .from('groups')
      .select('*')
      .order('created_at', { ascending: false }),
  ]);
  const joined = new Set<number>(
    (memRes.data ?? []).map((r: { group_id: number }) => r.group_id)
  );
  if (grpRes.error) {
    console.error('groups', grpRes.error);
    return { groups: [], joined };
  }
  return { groups: (grpRes.data ?? []) as Record<string, unknown>[], joined };
}

async function fetchUserTaskCompletionByTaskId(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<Map<number, boolean>> {
  const map = new Map<number, boolean>();
  const { data, error } = await supabase
    .from('user_tasks')
    .select('task_id, completed')
    .eq('user_id', userId)
    .not('task_id', 'is', null);
  if (error) {
    console.error('user_tasks fetch', error);
    return map;
  }
  for (const r of data ?? []) {
    if (r.task_id != null) map.set(Number(r.task_id), !!r.completed);
  }
  return map;
}

async function fetchLearnProgressMap(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const { data, error } = await supabase
    .from('learn_progress')
    .select('module_id, status')
    .eq('user_id', userId);
  if (error) {
    if (error.code === '42P01' || error.code === 'PGRST205') return map;
    console.error('learn_progress fetch', error);
    return map;
  }
  for (const r of data ?? []) {
    map.set(String(r.module_id), String(r.status ?? 'not_started'));
  }
  return map;
}

/** Cohort counts from materialized view (optional — table may not exist yet). */
async function fetchSocialProofMap(
  supabase: ReturnType<typeof createClient>,
  surface: string,
  personaKey: string,
  provinceKey: string,
  itemIds: string[]
): Promise<Map<string, number>> {
  const result = new Map<string, number>();
  if (!itemIds.length) return result;
  const { data, error } = await supabase
    .from('social_proof_counts')
    .select('item_id, user_count')
    .eq('surface', surface)
    .eq('persona', personaKey)
    .eq('province', provinceKey)
    .in('item_id', itemIds);
  if (error) return result;
  for (const r of data ?? []) {
    result.set(String(r.item_id), Number(r.user_count));
  }
  return result;
}

function socialProofPayload(
  count: number | undefined,
  kind: 'checklist' | 'group'
): { count: number; label: string } | null {
  if (count == null || count < 5) return null;
  if (kind === 'checklist') {
    return {
      count,
      label: `${count} newcomers like you completed this`,
    };
  }
  return {
    count,
    label: `${count} newcomers in your area joined`,
  };
}

function checklistCompletion(
  itemIds: string[],
  taskMap: Map<number, boolean>
): { total: number; completed: number; percentage: number } {
  const total = itemIds.length;
  let completed = 0;
  for (const id of itemIds) {
    if (taskMap.get(Number(id))) completed++;
  }
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { total, completed, percentage };
}

function buildCompanionContext(profile: ProfileRow | null) {
  if (!profile) {
    return {
      persona: null as string | null,
      city: null as string | null,
      province: null as string | null,
      arrival_date: null as string | null,
      goals: [] as string[],
      interests: [] as string[],
    };
  }
  return {
    persona: (profile.persona as string) ?? null,
    city: (profile.city as string) ?? null,
    province: (profile.province as string) ?? null,
    arrival_date: (profile.arrival_date as string) ?? null,
    goals: ((profile.goals as string[]) ?? []).map(g => String(g).replace(/_/g, ' ')),
    interests: ((profile.learning_interests as string[]) ?? []).map(i =>
      String(i).replace(/_/g, ' ')
    ),
  };
}

function buildStarters(ctx: ReturnType<typeof buildCompanionContext>): string[] {
  const city = ctx.city ?? 'your city';
  const prov = ctx.province ?? '';
  const loc = prov ? `${city}, ${prov}` : city;
  const pl = ctx.persona?.replace(/_/g, ' ') ?? 'a newcomer';
  return [
    `What do I need to know as ${pl} in ${city}?`,
    `Help me find practical next steps after arriving in ${loc}.`,
    `What programs or services near me match my interests?`,
  ];
}

function nudgeMissingFields(profile: ProfileRow | null): string[] {
  if (!profile) return ['profile'];
  const miss: string[] = [];
  if (!profile.city) miss.push('city');
  if (!profile.province) miss.push('province');
  if (!profile.persona) miss.push('persona');
  if (!profile.stage) miss.push('stage');
  return miss;
}

function rePersonalizeDue(profile: ProfileRow | null): boolean {
  if (!profile?.updated_at) return false;
  const t = new Date(String(profile.updated_at)).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t > RE_PERSONALIZE_MS;
}

async function logRecommendationEvents(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  entries: Array<{ surface: string; item_id: string; rank: number }>
) {
  if (!entries.length) return;
  const { error } = await supabase.from('recommendation_events').insert(
    entries.map(e => ({
      user_id: userId,
      surface: e.surface,
      item_id: e.item_id,
      rank: e.rank,
    }))
  );
  if (error) {
    console.warn('recommendation_events insert skipped:', error.message);
  }
}

function temporalFields(row: Record<string, unknown>) {
  const show_after_days = row.show_after_days as number | null | undefined;
  const show_before_days = row.show_before_days as number | null | undefined;
  return {
    show_after_days: show_after_days ?? null,
    show_before_days: show_before_days ?? null,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  if (req.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceKey) {
    return jsonResponse({ error: 'Missing Supabase configuration' }, 500);
  }

  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '') ??
    '';
  if (!token) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  const supabase = createClient(supabaseUrl, serviceKey);
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser(token);
  if (authErr || !user) {
    return jsonResponse({ error: 'Invalid session' }, 401);
  }

  const userId = user.id;
  const surfaceFilter = parseSurfaces(req.url);
  const want = (s: Surface) => !surfaceFilter || surfaceFilter.has(s);

  const [profile, flagOn] = await Promise.all([
    fetchOnboardingProfile(supabase, userId),
    isPersonalizationEnabled(userId),
  ]);

  const nudges = {
    missing_fields: nudgeMissingFields(profile),
    re_personalize: rePersonalizeDue(profile),
  };

  const body: Record<string, unknown> = { nudges };

  const profileReady = !!(profile?.persona && profile?.stage);

  const [checklistRows, learnRows, groupsBundle, taskMap, progressMap] =
    await Promise.all([
      want('checklist') && profileReady
        ? fetchChecklistRows(supabase, profile).catch(err => {
            console.error('checklist surface failed', err);
            return [];
          })
        : want('checklist') && !profileReady
          ? Promise.resolve([])
          : Promise.resolve([]),
      want('learn')
        ? fetchLearnRows(supabase).catch(err => {
            console.error('learn surface failed', err);
            return [];
          })
        : Promise.resolve([]),
      want('groups')
        ? fetchGroupsAndMembership(supabase, userId).catch(err => {
            console.error('groups surface failed', err);
            return { groups: [], joined: new Set<number>() };
          })
        : Promise.resolve({ groups: [], joined: new Set<number>() }),
      want('checklist')
        ? fetchUserTaskCompletionByTaskId(supabase, userId).catch(err => {
            console.error('user_tasks failed', err);
            return new Map<number, boolean>();
          })
        : Promise.resolve(new Map<number, boolean>()),
      want('learn')
        ? fetchLearnProgressMap(supabase, userId).catch(err => {
            console.error('learn_progress failed', err);
            return new Map<string, string>();
          })
        : Promise.resolve(new Map<string, string>()),
    ]);

  const { groups, joined } = groupsBundle;

  const personaKey = String(profile?.persona ?? '');
  const provinceKey = profile?.province != null ? String(profile.province) : '';

  async function buildChecklistBlock(
    rows: Record<string, unknown>[],
    personalized: boolean
  ) {
    const sorted = personalized
      ? rows
          .map(row => ({
            row,
            score: scoreContentItem(row, profile as ProfileRow, 'checklist'),
          }))
          .filter(x => x.score >= SCORE_FLOOR)
          .sort(compareRanked)
      : [...rows]
          .sort((a, b) => compareRanked({ score: 0, row: a }, { score: 0, row: b }));

    const itemIds = sorted.map(x => {
      const row = personalized
        ? (x as { row: Record<string, unknown>; score: number }).row
        : (x as Record<string, unknown>);
      return String(row.id);
    });

    let proofMap = new Map<string, number>();
    if (personalized && profile && itemIds.length) {
      proofMap = await fetchSocialProofMap(
        supabase,
        'checklist',
        personaKey,
        provinceKey,
        itemIds
      );
    }

    const items = sorted.map(x => {
      const row = personalized
        ? (x as { row: Record<string, unknown>; score: number }).row
        : (x as Record<string, unknown>);
      const score = personalized
        ? (x as { score: number }).score
        : null;
      const idStr = String(row.id);
      const count = proofMap.get(idStr);
      return {
        id: idStr,
        title: String(row.task_name ?? ''),
        description: String(row.task_description ?? ''),
        score,
        temporal: temporalFields(row),
        why_tag: personalized ? whyTagChecklist(profile as ProfileRow, row) : null,
        social_proof: socialProofPayload(count, 'checklist'),
      };
    });

    const completion = checklistCompletion(
      items.map(it => it.id),
      taskMap
    );

    if (personalized) {
      const logEntries = items.map((it, idx) => ({
        surface: 'checklist',
        item_id: it.id,
        rank: idx + 1,
      }));
      // Fire-and-forget — don't block the response
      logRecommendationEvents(supabase, userId, logEntries);
    }

    return { items, completion };
  }

  async function buildLearnBlock(
    rows: Record<string, unknown>[],
    personalized: boolean
  ) {
    const sorted = personalized
      ? rows
          .map(row => ({
            row,
            score: scoreContentItem(row, profile as ProfileRow, 'learn'),
          }))
          .filter(x => x.score >= SCORE_FLOOR)
          .sort(compareRanked)
      : [...rows].sort((a, b) =>
          compareRanked({ score: 0, row: a }, { score: 0, row: b })
        );

    const modules = sorted.map((x, i) => {
      const row = personalized
        ? (x as { row: Record<string, unknown>; score: number }).row
        : (x as Record<string, unknown>);
      const score = personalized ? (x as { score: number }).score : null;
      const sanityId = String(row.sanity_id ?? '');
      const progressRaw = progressMap.get(sanityId) ?? 'not_started';
      const progress =
        progressRaw === 'completed'
          ? 'completed'
          : progressRaw === 'in_progress'
            ? 'in_progress'
            : 'not_started';
      return {
        sanity_id: sanityId,
        title: String(row.title ?? ''),
        score,
        progress,
        why_tag: personalized ? whyTagLearn(profile as ProfileRow, row) : null,
      };
    });

    if (personalized) {
      // Fire-and-forget
      logRecommendationEvents(
        supabase,
        userId,
        modules.map((m, idx) => ({
          surface: 'learn',
          item_id: m.sanity_id,
          rank: idx + 1,
        }))
      );
    }

    return { modules };
  }

  function buildGroupsBlock(
    available: Record<string, unknown>[],
    personalized: boolean
  ) {
    const sorted = personalized
      ? available
          .map(row => ({
            row,
            score: scoreContentItem(row, profile as ProfileRow, 'group'),
          }))
          .filter(x => x.score >= SCORE_FLOOR)
          .sort(compareRanked)
      : [...available].sort((a, b) =>
          compareRanked({ score: 0, row: a }, { score: 0, row: b })
        );

    const items = sorted.map(x => {
      const row = personalized
        ? (x as { row: Record<string, unknown>; score: number }).row
        : (x as Record<string, unknown>);
      const score = personalized ? (x as { score: number }).score : null;
      return {
        id: String(row.id),
        name: String(row.group_name ?? '').trim(),
        score,
        why_tag: personalized ? whyTagGroup(profile as ProfileRow) : null,
        social_proof: null as { count: number; label: string } | null,
      };
    });

    return { items };
  }

  if (!flagOn) {
    if (want('checklist')) {
      const rows = profileReady
        ? checklistRows
        : [];
      body.checklist = await buildChecklistBlock(rows, false);
    }
    if (want('learn')) {
      body.learn = await buildLearnBlock(learnRows, false);
    }
    if (want('groups')) {
      const available = groups.filter(g => !joined.has(Number(g.id)));
      body.groups = buildGroupsBlock(available, false);
    }
    if (want('companion')) {
      const context = buildCompanionContext(profile);
      body.companion = { context, starters: buildStarters(context) };
    }
    return jsonResponse(body, 200);
  }

  if (!profileReady) {
    if (want('checklist')) {
      body.checklist = {
        items: [],
        completion: { total: 0, completed: 0, percentage: 0 },
      };
    }
    if (want('learn')) body.learn = { modules: [] };
    if (want('groups')) body.groups = { items: [] };
    if (want('companion')) {
      const context = buildCompanionContext(profile);
      body.companion = { context, starters: buildStarters(context) };
    }
    return jsonResponse(body, 200);
  }

  if (want('checklist')) {
    body.checklist = await buildChecklistBlock(checklistRows, true);
  }
  if (want('learn')) {
    body.learn = await buildLearnBlock(learnRows, true);
  }
  if (want('groups')) {
    const available = groups.filter(g => !joined.has(Number(g.id)));
    const block = buildGroupsBlock(available, true);
    body.groups = block;
    // Fire-and-forget
    logRecommendationEvents(
      supabase,
      userId,
      block.items.map((it, idx) => ({
        surface: 'groups',
        item_id: it.id,
        rank: idx + 1,
      }))
    );
  }
  if (want('companion')) {
    const context = buildCompanionContext(profile);
    body.companion = { context, starters: buildStarters(context) };
  }

  return jsonResponse(body, 200);
});
