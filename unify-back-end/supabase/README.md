# Unify shared database

This directory is the canonical database owner for the single Supabase database used by the web and mobile applications.

It owns database schema, migrations, seed policy, and database tests only. Edge Functions remain in their existing repositories and are not moved, modified, or deployed from here.

## Current state

The production-derived baseline is not committed yet. Read `BASELINE_STATUS.md` before doing any database work. While `policy/baseline-state.json` is in `foundation` phase, `migrations/` must remain empty.

The old SQL remains frozen in these noncanonical locations:

- `unify-front-end/supabase/migrations/`
- `unify-back-end/src/database/`

Those files are historical evidence only. Do not edit, replay, copy into the SQL editor, or deploy them.

## Safe commands

From `unify-back-end`:

```bash
npm test
npm run db:validate
```

After the baseline becomes active, create migrations only through the pinned project CLI:

```bash
npm run db:new -- <snake_case_name>
```

The repository intentionally provides no production push, migration-repair, linked-reset, remote `psql`, or Functions deployment script.

## Change workflow

1. Start with a backend PR that explains the web and mobile impact.
2. Generate a unique 14-digit migration filename through the CLI.
3. Validate a blank local reset and database tests before review.
4. Require review from the shared-database owners.
5. Use a protected production environment for any eventual deployment and verify a dry run first.

Never include production rows, database URLs, passwords, service-role keys, Vault values, or cron secrets in Git.
