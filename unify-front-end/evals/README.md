# AI Companion Eval Harness

Promptfoo-based regression evals for the AI Companion (`rag-query` Supabase edge function): a RAG chat for newcomers to Canada. Hits the deployed edge function with synthetic newcomer profiles, then runs LLM-as-judge rubrics (faithfulness, relevance, safety, personalization, anti-stereotype) plus deterministic checks.

## How to run

1. Install dependencies (one-time):
   ```bash
   npm install -D promptfoo @types/node tsx
   ```
2. Copy env vars and fill in real values:
   ```bash
   cp evals/.env.example evals/.env.local
   ```
   Required: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENROUTER_API_KEY`, `EVAL_BYPASS_SECRET`.

   The bypass secret must also be set as a Supabase Functions secret so the
   deployed `rag-query` function recognizes eval requests:
   ```bash
   # generate a fresh secret if you don't have one
   openssl rand -hex 32

   # set it in Supabase (one-time per project)
   npx supabase secrets set EVAL_BYPASS_SECRET=<paste hex> --project-ref <project-ref>
   ```
   Then put the **same value** in `evals/.env.local` as `EVAL_BYPASS_SECRET`.

   Why a separate secret? `SUPABASE_SERVICE_ROLE_KEY` exists in two formats
   right now (legacy `eyJ…` JWT vs new `sb_secret_…`); a key-equality check
   against the Authorization header would silently fail when the formats
   diverge. The dedicated bypass secret avoids that whole class of bug.
3. Run the suite:
   ```bash
   npx promptfoo eval -c evals/promptfooconfig.yaml --env-path evals/.env.local
   ```
   The `--env-path` flag is required — promptfoo defaults to looking for `.env` in the CWD, not in `evals/`.
4. View the report:
   ```bash
   npx promptfoo view
   ```

## Adding cases

Cases live in `cases/*.yaml`. Each file is a YAML list of test entries. To add a case:

1. Pick (or add) a synthetic profile in `lib/syntheticProfiles.ts`.
2. Add a new entry to an existing case file (or create a new file in `cases/`):
   ```yaml
   - description: "Short human-readable summary"
     vars:
       prompt: "The user message to send"
       profile: { ... onboarding profile fields ... }
       profile_summary: "One-line summary used by judges"
       expected_tailoring: "What good profile-aware behavior looks like"
     assert:
       - type: contains
         value: "PGWP"
       - type: llm-rubric
         rubric: file://judges/faithfulness.txt
   ```
3. Re-run `npx promptfoo eval` and inspect the diff.

`promptfooconfig.yaml` already globs `cases/*.yaml`, so new files are picked up automatically.

## Tuning judges

LLM judges live in `judges/*.txt`. Each is a plain prompt with `{{output}}` and `{{vars.*}}` interpolation. If a judge is failing too many genuinely good answers (false positives) or letting bad ones through (false negatives):

1. Open the report and find the offending case.
2. Inspect the judge's reason text — it's logged with each failure.
3. Tighten or loosen the rubric in the corresponding `.txt` file.
4. Re-run on the same case set to confirm the new rubric behaves.

Keep judges binary (YES/NO + one sentence). Multi-axis rubrics produce noisier signal.

## Baseline (2026-05-09)

First clean run after the AI Companion optimization PR. Treat these numbers as the watermark — future PRs should not regress them.

| Metric                  | Value         |
|-------------------------|---------------|
| Cases passed            | 10/40 (25%)   |
| Latency p50             | 2.3s          |
| Latency p95             | 8.3s          |
| Latency max             | 10.7s         |

A case passes only when every assertion (deterministic + LLM judges) passes. With 4-6 assertions per case and per-judge rates of 48-100%, the compounded case-level pass rate sits around 25%. That is normal for this style of suite — track the per-judge numbers below for the real signal.

| Judge            | Pass rate     |
|------------------|---------------|
| anti-stereotype  | 6/6 (100%)    |
| faithfulness     | 26/27 (96%)   |
| relevance        | 29/36 (81%)   |
| personalization  | 23/48 (48%)   |

Deterministic assertions (JavaScript length bounds, contains, icontains-any, not-contains) pass at 85-100% — model output shape and required keyword coverage is solid.

**Watch list:** personalization at 48% is the real opportunity. The model frequently fails to reference province/immigration-status context that the user profile provided. Targeted system-prompt work in `rag-query/index.ts` (`buildUserProfileContext`) is the next lever.

## TODO

1. Deploy the `rag-query` edge function changes that accept an `eval_profile` body field plus an `x-eval-mode: 1` header (bypasses the DB profile lookup). Currently the harness assumes this exists; without it, the function will look up profiles by user id and fail.
2. Wire this into CI (GitHub Actions) — gate PRs on regressions in faithfulness/safety pass rate.
3. Once streaming lands in the edge function, measure TTFT (time-to-first-token) per case and add a latency assertion to the provider response.

## Cost note

A full run is ~30 cases. Each case = 1 RAG call (DeepSeek/Gemini, ~$0.0005) + 1-3 judge calls (Haiku 4.5, ~$0.001 each). Total: roughly **$0.05 per full run**. Iterating on a single case is essentially free.
