# Learn Personalization Fix — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the learn-personalization branch so modules are ranked by relevance to the user's onboarding profile, with clear UI sections and a "why this?" banner on the module detail screen.

**Architecture:** The existing `personalize` edge function is simplified to use binary interest + persona matching against seeded `learn_modules` metadata. The client hook drops the feature flag and trusts the edge function's ordering. The Learn tab splits into three sections (Continue, Recommended, Explore). The module detail screen gains a contextual "why" banner passed via route params.

**Tech Stack:** React Native / Expo, Supabase Edge Functions (Deno), Supabase Postgres, React Query v5

---

### Task 1: Seed learn_modules with real metadata

**Files:**
- Create: `unify-front-end/supabase/migrations/20260414_seed_learn_modules_metadata.sql`

This is the single most important change — without it, scoring produces identical results for every module.

- [ ] **Step 1: Write the seed migration**

```sql
-- Seed learn_modules with interests and personas mapped from onboarding quiz options.
-- interests values match LearningInterest type: documents, employment, finance, housing, pr_immigration, healthcare, family_kids, transit
-- personas values match Persona type: international_student, skilled_worker, refugee

UPDATE learn_modules SET interests = '{documents}', personas = '{}' WHERE sanity_id = '0777d5d9-02fe-4e7d-b644-2e25d1c4579a'; -- Documentation
UPDATE learn_modules SET interests = '{}', personas = '{international_student}' WHERE sanity_id = '1c0e599c-22a4-4b6f-ac12-3f4c01153eeb'; -- Simon Fraser University (SFU)
UPDATE learn_modules SET interests = '{healthcare}', personas = '{}' WHERE sanity_id = '1f43061d-0062-4ea5-bd82-6b25e8ee5a55'; -- Healthcare
UPDATE learn_modules SET interests = '{housing}', personas = '{}' WHERE sanity_id = '23aeb3ad-65e7-4e03-97b2-a3e14ffde080'; -- Housing
UPDATE learn_modules SET interests = '{finance}', personas = '{}' WHERE sanity_id = '4044e0bc-d26b-4a1e-9b7d-6a5e95c7f8ce'; -- Scam Prevention
UPDATE learn_modules SET interests = '{}', personas = '{international_student}' WHERE sanity_id = '40bfab0e-63a5-46e4-8911-24de6dd72ca2'; -- Education
UPDATE learn_modules SET interests = '{finance}', personas = '{}' WHERE sanity_id = '4c79ebb5-b03a-47aa-862e-6d0853eba7d4'; -- Finance
UPDATE learn_modules SET interests = '{}', personas = '{}' WHERE sanity_id = '80e8804e-c063-4264-ba4d-a02354718e57'; -- Canadian Culture
UPDATE learn_modules SET interests = '{}', personas = '{}' WHERE sanity_id = '968620ce-2843-4f5a-9c84-47fdf8c44ec9'; -- Test module to be deleted
UPDATE learn_modules SET interests = '{pr_immigration}', personas = '{skilled_worker,refugee}' WHERE sanity_id = '9717e260-bdeb-4ee4-8d39-4159a48eb627'; -- Permanent Resident (PR)
UPDATE learn_modules SET interests = '{employment}', personas = '{}' WHERE sanity_id = 'baeece22-8ac0-48a0-b310-baab55e38f88'; -- Employment
UPDATE learn_modules SET interests = '{finance}', personas = '{}' WHERE sanity_id = 'e0e9106e-c685-439a-8c67-2db46d7e7472'; -- Taxes & Government Benefits
UPDATE learn_modules SET interests = '{transit}', personas = '{}' WHERE sanity_id = 'fd8898a8-5802-4bd2-aa0b-097f89df5de0'; -- Transportation
```

- [ ] **Step 2: Run the migration against production via Supabase MCP**

Use `mcp__supabase__execute_sql` to run the UPDATE statements. Then verify:

```sql
SELECT sanity_id, title, interests, personas FROM learn_modules ORDER BY title;
```

Expected: Each row shows the correct interests/personas per the mapping above. No row should have both interests and personas empty except "Canadian Culture" and "Test module to be deleted".

- [ ] **Step 3: Commit**

```bash
git add unify-front-end/supabase/migrations/20260414_seed_learn_modules_metadata.sql
git commit -m "seed learn_modules with interest/persona metadata for scoring"
```

---

### Task 2: Simplify the scoring in the personalize edge function

**Files:**
- Modify: `unify-front-end/supabase/functions/personalize/index.ts`

Replace the 5-dimensional weighted scoring with simple binary interest + persona matching, parallelize DB queries, and fix the sorting.

- [ ] **Step 1: Replace the scoring interfaces and function**

In `unify-front-end/supabase/functions/personalize/index.ts`, replace the entire `// ─── Learn surface` section (lines 87–233) with:

```ts
// ─── Learn surface ────────────────────────────────────────────────────────────

interface LearnModule {
  sanity_id: string;
  title: string;
  personas: string[];
  interests: string[];
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

const PERSONA_LABELS: Record<string, string> = {
  international_student: 'international students',
  skilled_worker: 'skilled workers & immigrants',
  refugee: 'refugees & protected persons',
};

const INTEREST_LABELS: Record<string, string> = {
  documents: 'documents & IDs',
  employment: 'jobs & career',
  finance: 'money & banking',
  housing: 'housing',
  pr_immigration: 'PR & immigration',
  healthcare: 'healthcare',
  family_kids: 'family & kids',
  transit: 'transit',
};

function scoreModule(
  module: LearnModule,
  profile: OnboardingProfile
): { score: number; why_tag: string } {
  const hasInterestMatch =
    module.interests.length > 0 &&
    profile.learning_interests.some(i => module.interests.includes(i));

  const hasPersonaMatch =
    module.personas.length > 0 &&
    !!profile.persona &&
    module.personas.includes(profile.persona);

  const score = (hasInterestMatch ? 0.7 : 0) + (hasPersonaMatch ? 0.3 : 0);

  // Build why_tag from matched signals
  let why_tag = '';
  const matchedInterest = hasInterestMatch
    ? profile.learning_interests.find(i => module.interests.includes(i))
    : null;
  const interestLabel = matchedInterest
    ? INTEREST_LABELS[matchedInterest] ?? matchedInterest.replace(/_/g, ' ')
    : '';
  const personaLabel = hasPersonaMatch && profile.persona
    ? PERSONA_LABELS[profile.persona] ?? profile.persona.replace(/_/g, ' ')
    : '';

  if (hasInterestMatch && hasPersonaMatch) {
    why_tag = `Recommended for ${personaLabel} interested in ${interestLabel}`;
  } else if (hasInterestMatch) {
    why_tag = `Based on your interest in ${interestLabel}`;
  } else if (hasPersonaMatch) {
    why_tag = `Recommended for ${personaLabel}`;
  }

  return { score, why_tag };
}

async function buildLearnSurface(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  profile: OnboardingProfile
): Promise<{ modules: ScoredModule[] }> {
  // Parallel fetch: module metadata + user progress
  const [modulesResult, progressResult] = await Promise.all([
    supabase
      .from('learn_modules')
      .select('sanity_id, title, personas, interests'),
    supabase
      .from('learn_progress')
      .select('module_id, status, completed_at')
      .eq('user_id', userId),
  ]);

  if (modulesResult.error) {
    console.error('personalize/learn: modules fetch error', modulesResult.error);
    return { modules: [] };
  }

  const progressByModule = new Map<string, LearnProgressRow>();
  for (const row of (progressResult.data as LearnProgressRow[]) ?? []) {
    progressByModule.set(row.module_id, row);
  }

  // Score each module
  const scored: ScoredModule[] = ((modulesResult.data as LearnModule[]) ?? []).map(m => {
    const { score, why_tag } = scoreModule(m, profile);
    const progress = progressByModule.get(m.sanity_id);
    return {
      sanity_id: m.sanity_id,
      title: m.title,
      score,
      progress: progress?.status ?? 'not_started',
      completed_at: progress?.completed_at ?? null,
      why_tag,
    };
  });

  // Sort: in_progress first → then by score desc → ties by title asc → completed last
  scored.sort((a, b) => {
    const aInProgress = a.progress === 'in_progress' ? 0 : 1;
    const bInProgress = b.progress === 'in_progress' ? 0 : 1;
    if (aInProgress !== bInProgress) return aInProgress - bInProgress;

    const aCompleted = a.progress === 'completed' ? 1 : 0;
    const bCompleted = b.progress === 'completed' ? 1 : 0;
    if (aCompleted !== bCompleted) return aCompleted - bCompleted;

    if (b.score !== a.score) return b.score - a.score;
    return a.title.localeCompare(b.title);
  });

  return { modules: scored };
}
```

- [ ] **Step 2: Deploy the updated edge function**

```bash
cd unify-front-end && npx supabase functions deploy personalize
```

Or use `mcp__supabase__deploy_edge_function` with slug `personalize`.

- [ ] **Step 3: Verify the edge function works**

Use Supabase MCP `get_logs` for the `personalize` function or test via curl. A user with `learning_interests: ['finance']` should see Finance, Scam Prevention, and Taxes & Government Benefits with score `0.7`, while Healthcare should have score `0`.

- [ ] **Step 4: Commit**

```bash
git add unify-front-end/supabase/functions/personalize/index.ts
git commit -m "simplify learn scoring to binary interest + persona matching"
```

---

### Task 3: Delete feature flag, simplify usePersonalizedModules hook

**Files:**
- Delete: `unify-front-end/constants/featureFlags.ts`
- Modify: `unify-front-end/hooks/learn/usePersonalizedModules.ts`
- Modify: `unify-front-end/types/learn.ts`

- [ ] **Step 1: Add `why_tag` to the PersonalizedModule type**

In `unify-front-end/types/learn.ts`, the `PersonalizedModule` interface already has `why_tag`. Verify it matches what the edge function returns. Current state is correct — no change needed.

- [ ] **Step 2: Rewrite the hook**

Replace the entire contents of `unify-front-end/hooks/learn/usePersonalizedModules.ts` with:

```ts
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { getAllModulesWithSubmodules } from '@/services/sanity/modules';
import type {
  PersonalizeLearnResponse,
  PersonalizedModule,
} from '@/types/learn';
import type { SanityModuleWithSubmodules } from '@/types/sanity';

// ─── Personalize fetch ────────────────────────────────────────────────────────

async function fetchPersonalizedLearn(): Promise<PersonalizeLearnResponse | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) return null;

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);

  try {
    const res = await fetch(
      `${supabaseUrl}/functions/v1/personalize?surfaces=learn`,
      {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      }
    );

    if (!res.ok) return null;
    const json = await res.json();
    return (json?.learn as PersonalizeLearnResponse) ?? null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// ─── Merge helper ─────────────────────────────────────────────────────────────

/**
 * Merge personalized ranking with full Sanity module data.
 * Preserves the edge function's order (do NOT re-sort).
 * Sanity modules with no learn_modules row are appended at the end with score 0.
 */
function mergePersonalizedWithSanity(
  personalized: PersonalizedModule[],
  sanityModules: SanityModuleWithSubmodules[]
): PersonalizedSanityModule[] {
  const sanityById = new Map(sanityModules.map(m => [m._id, m]));
  const result: PersonalizedSanityModule[] = [];

  for (const pm of personalized) {
    const sanity = sanityById.get(pm.sanity_id);
    if (sanity) {
      result.push({
        ...sanity,
        progress: pm.progress,
        score: pm.score,
        why_tag: pm.why_tag,
      });
      sanityById.delete(pm.sanity_id);
    }
  }

  // Append unscored Sanity modules at the end
  for (const remaining of sanityById.values()) {
    result.push({ ...remaining, progress: 'not_started', score: 0, why_tag: '' });
  }

  return result;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export type PersonalizedSanityModule = SanityModuleWithSubmodules & {
  progress: PersonalizedModule['progress'];
  score: number;
  why_tag: string;
};

interface UsePersonalizedModulesResult {
  modules: PersonalizedSanityModule[] | undefined;
  isLoading: boolean;
  isPersonalized: boolean;
  error: Error | null;
  refetch: () => void;
}

export function usePersonalizedModules(): UsePersonalizedModulesResult {
  // Always fetch Sanity modules (they own colorTheme, icon, submodules)
  const {
    data: sanityModules,
    isLoading: sanityLoading,
    error: sanityError,
    refetch: refetchSanity,
  } = useQuery({
    queryKey: ['sanity', 'modules'],
    queryFn: getAllModulesWithSubmodules,
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    placeholderData: keepPreviousData,
  });

  // Always fetch personalized ranking
  const {
    data: personalizedData,
    isLoading: personalizeLoading,
    refetch: refetchPersonalized,
  } = useQuery({
    queryKey: ['personalize', 'learn'],
    queryFn: fetchPersonalizedLearn,
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    placeholderData: keepPreviousData,
    retry: 1,
  });

  const isLoading = sanityLoading || personalizeLoading;

  const isPersonalized =
    !!personalizedData?.modules?.length && !!sanityModules?.length;

  let modules: PersonalizedSanityModule[] | undefined;

  if (sanityModules) {
    if (isPersonalized && personalizedData) {
      modules = mergePersonalizedWithSanity(
        personalizedData.modules,
        sanityModules
      );
    } else {
      // Fallback: Sanity order, unscored
      modules = sanityModules.map(m => ({
        ...m,
        progress: 'not_started' as const,
        score: 0,
        why_tag: '',
      }));
    }
  }

  const refetch = () => {
    refetchSanity();
    refetchPersonalized();
  };

  return {
    modules,
    isLoading,
    isPersonalized,
    error: sanityError as Error | null,
    refetch,
  };
}
```

- [ ] **Step 3: Delete the feature flag file**

```bash
rm unify-front-end/constants/featureFlags.ts
```

- [ ] **Step 4: Verify no other imports of featureFlags**

Search for `featureFlags` across the codebase. The only import was in `usePersonalizedModules.ts` which we just rewrote. If anything else imports it, remove that import.

- [ ] **Step 5: Commit**

```bash
git add unify-front-end/hooks/learn/usePersonalizedModules.ts unify-front-end/constants/featureFlags.ts
git commit -m "remove feature flag, simplify personalized modules hook"
```

---

### Task 4: Update Learn tab UI to three sections

**Files:**
- Modify: `unify-front-end/app/(tabs)/Learn/index.tsx`
- Modify: `unify-front-end/components/learn/PathwayCard.tsx`

- [ ] **Step 1: Update Learn/index.tsx section splitting and rendering**

First, update the hook destructuring (line 39) to remove the now-unused `isPersonalized`:

```ts
  const { modules, isLoading, error, refetch } =
    usePersonalizedModules();
```

Then replace the section splitting logic (lines 83-85) with:

```ts
  // Split modules into three sections
  const inProgressModules = modules?.filter(m => m.progress === 'in_progress') ?? [];
  const recommendedModules = modules?.filter(m => m.progress === 'not_started' && m.score > 0) ?? [];
  const exploreModules = modules?.filter(m =>
    (m.progress === 'not_started' && m.score === 0) || m.progress === 'completed'
  ) ?? [];
  const hasPersonalizedResults = recommendedModules.length > 0;
```

Then replace the module rendering sections (the `{/* Active modules */}` section header through the end of the `{/* Completed modules section */}` block — lines 185-247) with:

```tsx
          {/* Continue Learning — in-progress modules */}
          {inProgressModules.length > 0 && (
            <>
              <SectionHeader title='Continue Learning' style={{ marginTop: 15 }} />
              <View style={styles.pathwaysGrid}>
                {inProgressModules.map((module, index) => {
                  const blobIndex = index % 5;
                  return (
                    <PathwayCard
                      key={module._id}
                      title={module.title}
                      modulesLabel={`${module.submodules?.length || 0} section${(module.submodules?.length || 0) === 1 ? '' : 's'}`}
                      href={
                        `/(tabs)/Learn/modules/${module._id}?blobIndex=${blobIndex}` as any
                      }
                      colorTheme={module.colorTheme?.hex}
                      icon={module.icon}
                      index={index}
                      moduleId={module._id}
                      progress={module.progress}
                    />
                  );
                })}
              </View>
            </>
          )}

          {/* Recommended for You — scored modules */}
          <SectionHeader
            title={hasPersonalizedResults ? 'Recommended for You' : 'Subjects'}
            style={{ marginTop: 15 }}
          />
          <View style={styles.pathwaysGrid}>
            {isLoading ? (
              <>
                <PathwayCardSkeletonLoader />
                <PathwayCardSkeletonLoader />
              </>
            ) : error ? (
              <Text style={styles.errorText}>Error loading modules</Text>
            ) : (hasPersonalizedResults ? recommendedModules : modules ?? []).length > 0 ? (
              (hasPersonalizedResults ? recommendedModules : modules ?? []).map((module, index) => {
                const offset = inProgressModules.length;
                const blobIndex = (offset + index) % 5;
                return (
                  <PathwayCard
                    key={module._id}
                    title={module.title}
                    modulesLabel={`${module.submodules?.length || 0} section${(module.submodules?.length || 0) === 1 ? '' : 's'}`}
                    href={
                      `/(tabs)/Learn/modules/${module._id}?blobIndex=${blobIndex}&whyTag=${encodeURIComponent(module.why_tag || '')}` as any
                    }
                    colorTheme={module.colorTheme?.hex}
                    icon={module.icon}
                    index={offset + index}
                    moduleId={module._id}
                    progress={module.progress}
                  />
                );
              })
            ) : (
              <Text style={styles.errorText}>No modules available</Text>
            )}
          </View>

          {/* Explore More — unscored + completed */}
          {hasPersonalizedResults && exploreModules.length > 0 && (
            <>
              <SectionHeader title='Explore More' style={{ marginTop: 24 }} />
              <View style={styles.pathwaysGrid}>
                {exploreModules.map((module, index) => {
                  const offset = inProgressModules.length + recommendedModules.length;
                  const blobIndex = (offset + index) % 5;
                  return (
                    <PathwayCard
                      key={module._id}
                      title={module.title}
                      modulesLabel={`${module.submodules?.length || 0} section${(module.submodules?.length || 0) === 1 ? '' : 's'}`}
                      href={
                        `/(tabs)/Learn/modules/${module._id}?blobIndex=${blobIndex}` as any
                      }
                      colorTheme={module.colorTheme?.hex}
                      icon={module.icon}
                      index={offset + index}
                      moduleId={module._id}
                      progress={module.progress}
                    />
                  );
                })}
              </View>
            </>
          )}
```

- [ ] **Step 2: Verify the app compiles**

```bash
cd unify-front-end && npx expo start
```

Check the Learn tab loads without errors. Verify you see the correct section headers based on the logged-in user's profile.

- [ ] **Step 3: Commit**

```bash
git add unify-front-end/app/(tabs)/Learn/index.tsx
git commit -m "split Learn tab into Continue/Recommended/Explore sections"
```

---

### Task 5: Add "why this?" banner on module detail screen

**Files:**
- Modify: `unify-front-end/app/(tabs)/Learn/modules/[moduleId]/index.tsx`

- [ ] **Step 1: Read whyTag from route params and render the banner**

In `unify-front-end/app/(tabs)/Learn/modules/[moduleId]/index.tsx`, update the `useLocalSearchParams` call (around line 168) to include `whyTag`:

```ts
  const { moduleId, blobIndex, whyTag } = useLocalSearchParams<{
    moduleId: string;
    blobIndex?: string;
    whyTag?: string;
  }>();

  const decodedWhyTag = whyTag ? decodeURIComponent(whyTag) : '';
```

Then find the module header area in the JSX (the section with the blob background and module title that renders above the submodule list). Add the banner immediately after the header section closes and before the submodule list begins. Look for where the `ScrollView` content starts rendering the submodule cards — insert this just before it:

```tsx
          {/* Why this? personalization context */}
          {decodedWhyTag ? (
            <View style={styles.whyBanner}>
              <Feather name='info' size={14} color={subjectColor} />
              <Text style={[styles.whyBannerText, { color: subjectColor }]}>
                {decodedWhyTag}
              </Text>
            </View>
          ) : null}
```

Add these styles to the StyleSheet:

```ts
  whyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 4,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#f8f9fa',
  },
  whyBannerText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
```

- [ ] **Step 2: Verify in the app**

Navigate to a module from the "Recommended for You" section. The banner should appear with the personalization reason. Navigate to a module from "Explore More" — no banner should appear.

- [ ] **Step 3: Commit**

```bash
git add unify-front-end/app/(tabs)/Learn/modules/[moduleId]/index.tsx
git commit -m "add why-this personalization banner on module detail screen"
```

---

### Task 6: Security fixes — require auth on webhook and sync endpoints

**Files:**
- Modify: `unify-front-end/supabase/functions/sanity-webhook/index.ts`
- Modify: `unify-front-end/supabase/functions/sync-learn-modules/index.ts`

- [ ] **Step 1: Fix sanity-webhook auth**

In `unify-front-end/supabase/functions/sanity-webhook/index.ts`, replace the webhook secret check block (around lines 79-85):

```ts
  // Verify webhook secret
  const webhookSecret = Deno.env.get('SANITY_WEBHOOK_SECRET');
  if (webhookSecret) {
    const incomingSecret = req.headers.get('x-sanity-webhook-secret');
    if (incomingSecret !== webhookSecret) {
```

With:

```ts
  // Verify webhook secret — required, not optional
  const webhookSecret = Deno.env.get('SANITY_WEBHOOK_SECRET');
  if (!webhookSecret) {
    console.error('sanity-webhook: SANITY_WEBHOOK_SECRET not configured');
    return new Response(
      JSON.stringify({ error: 'Server misconfigured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  const incomingSecret = req.headers.get('x-sanity-webhook-secret');
  if (incomingSecret !== webhookSecret) {
```

Also remove the closing `}` that was part of the old `if (webhookSecret)` block (there's an extra closing brace to delete).

- [ ] **Step 2: Fix sync-learn-modules auth**

In `unify-front-end/supabase/functions/sync-learn-modules/index.ts`, replace the API key check (around lines 43-46):

```ts
  const apiKey = Deno.env.get('SYNC_LEARN_MODULES_API_KEY');
  if (apiKey && req.headers.get('x-api-key') !== apiKey) {
```

With:

```ts
  const apiKey = Deno.env.get('SYNC_LEARN_MODULES_API_KEY');
  if (!apiKey) {
    console.error('sync-learn-modules: SYNC_LEARN_MODULES_API_KEY not configured');
    return new Response(JSON.stringify({ error: 'Server misconfigured' }), {
      status: 500,
      headers: JSON_HEADERS,
    });
  }
  if (req.headers.get('x-api-key') !== apiKey) {
```

- [ ] **Step 3: Deploy both edge functions**

Deploy via Supabase CLI or MCP:
- `sanity-webhook`
- `sync-learn-modules`

- [ ] **Step 4: Verify secrets are set in Supabase**

Check with the user: Are `SANITY_WEBHOOK_SECRET`, `SYNC_LEARN_MODULES_API_KEY`, `SANITY_PROJECT_ID`, and `SANITY_API_TOKEN` configured in Supabase Dashboard → Edge Functions → Secrets? If not, walk the user through setting them:

1. **SANITY_WEBHOOK_SECRET**: Generate a random string (e.g., `openssl rand -hex 32`). Set it both in Supabase Edge Secrets AND in Sanity Manage → API → GROQ Webhooks → the webhook for this project → Secret header value.
2. **SYNC_LEARN_MODULES_API_KEY**: Generate another random string. Set in Edge Secrets AND in Supabase Vault (`INSERT INTO vault.secrets (name, secret) VALUES ('sync_learn_modules_api_key', 'your-key-here');`).
3. **SANITY_PROJECT_ID**: Your Sanity project ID.
4. **SANITY_API_TOKEN**: A Sanity read token.

- [ ] **Step 5: Commit**

```bash
git add unify-front-end/supabase/functions/sanity-webhook/index.ts unify-front-end/supabase/functions/sync-learn-modules/index.ts
git commit -m "require auth secrets on webhook and sync endpoints"
```

---

### Task 7: Final verification and cleanup

**Files:**
- Verify: `unify-front-end/types/learn.ts` (no changes expected)
- Delete: `unify-front-end/constants/featureFlags.ts` (confirm deleted in Task 3)

- [ ] **Step 1: Search for any remaining featureFlags references**

```bash
grep -r "featureFlags\|FEATURE_FLAGS" unify-front-end/  --include="*.ts" --include="*.tsx"
```

Expected: zero results. If any remain, remove them.

- [ ] **Step 2: Search for any broken imports from the deleted types**

```bash
grep -r "from.*@/types/learn\|from.*types/learn" unify-front-end/ --include="*.ts" --include="*.tsx"
```

Expected: Only these files should import from `@/types/learn`:
- `hooks/learn/usePersonalizedModules.ts` (PersonalizeLearnResponse, PersonalizedModule)
- `components/learn/PathwayCard.tsx` (ModuleProgressStatus)
- `services/learn/moduleProgressService.ts` (ModuleProgressStatus)
- `app/(tabs)/Learn/modules/[moduleId]/[submoduleId]/intro/[pageNum].tsx` (SubmoduleIntroSection)

All of these types exist in the current `types/learn.ts`. If any file imports a type that was removed, it needs fixing.

- [ ] **Step 3: Run TypeScript type-check**

```bash
cd unify-front-end && npx tsc --noEmit
```

Fix any type errors.

- [ ] **Step 4: Test the full flow in the app**

1. Open the Learn tab — verify three sections appear for a user with matching interests
2. Open the Learn tab as a user with no matching interests — verify it falls back to single "Subjects" section
3. Tap a module from "Recommended for You" — verify the "why" banner appears
4. Tap a module from "Explore More" — verify no "why" banner
5. Open a module (verify "Continue" badge appears on the card after)
6. Pull to refresh — verify the data reloads

- [ ] **Step 5: Final commit if any cleanup was needed**

```bash
git add -A
git commit -m "final cleanup: verify types and remove stale references"
```
