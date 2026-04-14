# Learn Personalization — Simplified Scoring & UI Polish

**Date:** 2026-04-13
**Branch:** `learn-personalization` (fixing existing PR, not starting over)
**Status:** SPEC REVIEW

## Context

The `learn-personalization` branch built solid infrastructure (tables, edge function, webhook, progress tracking, client hook) but the personalization doesn't work because Sanity modules lack the metadata the scoring depends on. The scoring formula is also over-engineered for the available signals. This spec describes the fixes needed to make the feature ship.

## What We're Keeping (no changes needed)

- `learn_modules` table and schema
- `learn_progress` table and schema
- `sanity-webhook` edge function (structure — auth fix needed)
- `sync-learn-modules` edge function (structure — auth fix needed)
- `scripts/sync-sanity-modules.ts` CLI script
- `moduleProgressService.ts` (upsert/read progress)
- Progress tracking in `[moduleId]/index.tsx` (writes in_progress on open, completed when done)
- "Continue" / "Done" badges on PathwayCard
- `usePersonalizedModules` hook (structure — simplifications needed)
- Weekly pg_cron sync schedule migration

## Change 1: Seed learn_modules with real metadata

### Problem

All 13 `learn_modules` rows have empty `interests`, `goals`, `personas` arrays. The scoring function scores everything identically.

### Solution

Write a SQL migration that populates the `interests` and `personas` columns based on a manual mapping. The `goals` column stays in the table (no schema change) but is ignored by the new scoring — the onboarding goals (`learn_something`, `build_community`, `quick_answers`, `something_else`) are app-usage intents, not topic-specific. Learning interests map nearly 1:1 to modules.

### Mapping

| Module (sanity_id) | title | interests | personas |
|---|---|---|---|
| 0777d5d9-... | Documentation | `{documents}` | `{}` |
| 1c0e599c-... | Simon Fraser University (SFU) | `{}` | `{international_student}` |
| 1f43061d-... | Healthcare | `{healthcare}` | `{}` |
| 23aeb3ad-... | Housing | `{housing}` | `{}` |
| 4044e0bc-... | Scam Prevention | `{finance}` | `{}` |
| 40bfab0e-... | Education | `{}` | `{international_student}` |
| 4c79ebb5-... | Finance | `{finance}` | `{}` |
| 80e8804e-... | Canadian Culture | `{}` | `{}` |
| 968620ce-... | Test module to be deleted | `{}` | `{}` |
| 9717e260-... | Permanent Resident (PR) | `{pr_immigration}` | `{skilled_worker,refugee}` |
| baeece22-... | Employment | `{employment}` | `{}` |
| e0e9106e-... | Taxes & Government Benefits | `{finance}` | `{}` |
| fd8898a8-... | Transportation | `{transit}` | `{}` |

Notes:
- Modules with no interest/persona match (Canadian Culture, test module) will appear in "Explore More" for all users — they're never hidden, just deprioritized.
- `family_kids` interest has no matching module currently. That's fine — if a module is added later, it gets tagged via the Sanity webhook flow.
- Finance, Scam Prevention, and Taxes all map to the `finance` interest — users interested in money/banking see all three ranked high.

## Change 2: Simplify scoring in the edge function

### Problem

Current scoring uses 5 weighted dimensions (persona 0.35, interest 0.30, goal 0.25, province 0.10) with fuzzy string matching. Goals are useless for Learn. Province data is sparse. The complexity isn't justified.

### New scoring

Two signals, simple binary matching:

```
score = (has_interest_match ? 0.7 : 0) + (has_persona_match ? 0.3 : 0)

Where:
  has_interest_match: true if module.interests is non-empty AND any of user.learning_interests is in module.interests
  has_persona_match:  true if module.personas is non-empty AND user.persona is in module.personas
```

Modules with empty `personas` or `interests` arrays get no boost for that dimension — they must be explicitly tagged to score.

Score range: 0, 0.3, 0.7, or 1.0. That's it — four possible values.

**Sorting rules:**
1. In-progress modules first (user already started them)
2. Then by score descending
3. Ties broken by module title alphabetically (stable, predictable)
4. Completed modules last

**No filtering.** All modules are returned. The client splits them into sections based on score and progress.

### why_tag generation

Simple template based on which signal(s) matched:

- Both match: `"Recommended for {persona_label} interested in {interest_label}"`
- Interest only: `"Based on your interest in {interest_label}"`
- Persona only: `"Recommended for {persona_label}"`
- No match: `""` (empty string — client won't render anything)

Where `persona_label` maps: `international_student` → "international students", `skilled_worker` → "skilled workers & immigrants", `refugee` → "refugees & protected persons".

And `interest_label` uses the first matched interest, mapped: `documents` → "documents & IDs", `employment` → "jobs & career", `finance` → "money & banking", `housing` → "housing", `pr_immigration` → "PR & immigration", `healthcare` → "healthcare", `family_kids` → "family & kids", `transit` → "transit".

## Change 3: UI — Three sections + "why" on module detail

### Learn tab sections

The Learn tab renders modules in three sections:

1. **"Continue Learning"** — Only shown if there are in-progress modules. These always appear first.
2. **"Recommended for You"** — Modules with score > 0, not in-progress, not completed. Sorted by score descending.
3. **"Explore More"** — Modules with score = 0, not in-progress, not completed. Plus all completed modules at the very end (keeping the "Done" badge).

If no modules have score > 0 (edge case: user has no learning_interests or persona = 'other' with no matches), fall back to a single "Subjects" section with the current default order — same as non-personalized behavior.

Section headers use the existing `SectionHeader` component.

### "Why this?" on module detail screen

When a user taps into a module from the "Recommended for You" section, the module detail screen (`[moduleId]/index.tsx`) shows a small contextual banner near the top (below the header, above the submodule list). Design:

- Light background pill/banner (e.g., subtle warm tint matching the module's colorTheme at low opacity)
- Small icon (Feather `info` or `star`) + the `why_tag` text
- Only rendered when `why_tag` is a non-empty string
- The `why_tag` is passed as a route param from the PathwayCard navigation

This requires:
- Adding `why_tag` to the route params when navigating from Learn → module detail
- Reading it from `useLocalSearchParams` in the module detail screen
- Rendering a small styled `View` + `Text` conditionally

## Change 4: Security fixes

### Sanity webhook — require secret

Current code:
```ts
if (webhookSecret) {
  // only checks if set
}
```

Change to:
```ts
if (!webhookSecret) {
  return new Response(JSON.stringify({ error: 'Server misconfigured: missing webhook secret' }), {
    status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}
if (incomingSecret !== webhookSecret) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}
```

### Sync edge function — require API key

Same pattern: if `SYNC_LEARN_MODULES_API_KEY` is not set, return 500 instead of silently allowing unauthenticated access.

### Manual step required (user action)

The following secrets must be set in the Supabase dashboard (Settings → Edge Functions → Secrets):

1. `SANITY_WEBHOOK_SECRET` — any random string. Must also be configured in Sanity's webhook settings (Sanity Manage → API → Webhooks → Secret header value).
2. `SYNC_LEARN_MODULES_API_KEY` — any random string. Must also be stored in Supabase Vault as `sync_learn_modules_api_key` (the pg_cron job reads it from there).
3. `SANITY_PROJECT_ID` — your Sanity project ID (for the sync edge function to call Sanity API).
4. `SANITY_API_TOKEN` — a Sanity read token (for the sync edge function).

If these are already set from the initial PR work, no action needed. If not, I'll flag it during implementation.

## Change 5: Delete feature flag, simplify hook

### Delete `constants/featureFlags.ts`

The hook always attempts personalization. The fallback path (Sanity default order, all modules marked `not_started`, score 0) is already the un-personalized behavior — it's what happens when the edge function returns no data or fails. No flag needed.

### Simplify `usePersonalizedModules`

- Remove all `flagOn` / `FEATURE_FLAGS` references
- Always fetch personalized data
- Remove the redundant `result.sort()` in `mergePersonalizedWithSanity` — trust the edge function's ordering. The merge function should preserve the order from the personalize response and just enrich each item with Sanity content data (colorTheme, icon, submodules).
- Reduce client timeout from 8s to 3s

### Section splitting in Learn/index.tsx

The current code splits into `activeModules` and `completedModules`. Change to three groups:

```ts
const inProgressModules = modules?.filter(m => m.progress === 'in_progress') ?? [];
const recommendedModules = modules?.filter(m => m.progress === 'not_started' && m.score > 0) ?? [];
const exploreModules = modules?.filter(m =>
  (m.progress === 'not_started' && m.score === 0) || m.progress === 'completed'
) ?? [];
```

## Change 6: Parallelize edge function DB queries

In `buildLearnSurface`, change sequential queries to parallel:

```ts
const [{ data: modules, error: modulesErr }, { data: progressRows }] = await Promise.all([
  supabase.from('learn_modules').select('sanity_id, title, personas, interests, goals, province, difficulty'),
  supabase.from('learn_progress').select('module_id, status, completed_at').eq('user_id', userId),
]);
```

## Change 7: Verify deleted types

The old `types/learn.ts` had ~120 lines of types removed (Lesson, LessonPage, SubmoduleInfo, Module, etc.). Verify no other files import these types. If they're genuinely unused (all superseded by Sanity types in `types/sanity.ts`), the deletion is fine. If anything still references them, restore only what's needed.

## Out of scope (not in this fix)

- Temporal personalization (arrival_date-based scoring)
- recommendation_events logging
- Profile completeness nudges / re-personalization prompts
- Social proof counts
- Checklist personalization
- Companion changes (already working in the existing PR)

These are Phase 1.5 / Phase 2 items from the personalization engine design doc.

## Deployment steps

1. Deploy updated `personalize` edge function
2. Deploy updated `sanity-webhook` edge function (with required auth)
3. Deploy updated `sync-learn-modules` edge function (with required auth)
4. Run the seed migration (populates learn_modules with interests/personas)
5. Verify secrets are set in Supabase dashboard (see Change 4)
6. App update ships with new client code
