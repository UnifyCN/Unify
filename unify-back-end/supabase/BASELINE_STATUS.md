# Shared database baseline status

Status: **foundation only — not replayable or deployable**

Production `unify-social` is the schema authority for the one database shared by the web and mobile applications. As of 2026-08-16 it runs PostgreSQL 17.4 and has 70 migration-ledger rows; the latest version is `20260816221412`.

The existing repository SQL is frozen because it cannot reproduce production:

- The mobile chain has 66 files, including 55 noncanonical filenames and 47 files in duplicate-version groups.
- Its first migration alters `community_circles` before a later file creates that table.
- The two handwritten backend schemas contain invalid SQL and dependency-order failures.
- Only four local migration timestamps exactly match production.

## Approved reconstruction design

The baseline PR will derive schema from production, never from the broken legacy SQL:

1. Put the complete reviewed schema baseline in `20250109000001_day13_reminder.sql`, reusing the earliest production ledger version.
2. Add no-op compatibility markers for the other 69 exact production versions and names.
3. Require every future migration version to be greater than `20260816221412`.
4. Validate two blank local resets, database lint, pgTAP, object inventory, grants, RLS, triggers, and publication membership.
5. Run `supabase db push --linked --dry-run` against production; it must report no pending migrations.

Because every version already exists in production, this design does not rewrite or repair the production migration ledger.

## Production state requiring explicit review

An ordinary public-schema dump is not sufficient. The baseline must account for the `public` and `private` schemas, extensions without version pins, grants/default privileges, the application trigger on `auth.users`, the `email-assets` storage bucket, two Realtime publication members, sanitized cron definitions, and secret placeholders injected outside Git.

The two crawler tables currently have RLS disabled but grant access only to `service_role`. That is a separate security review: enabling RLS without compatible policies could break ingestion.

## Prohibited until this status becomes `baseline_ready`

- `supabase db push`, including dry runs from an unreviewed checkout
- `supabase migration repair`
- any linked or remote database reset
- Dashboard SQL/Table Editor schema changes
- adding migrations to this canonical directory

Owner-level database access is still required for the production schema dump and final linked dry run. No production mutation is part of the foundation phase.

Edge Functions are explicitly outside this ownership and reconstruction work. Their source, configuration, and deployments remain unchanged.
