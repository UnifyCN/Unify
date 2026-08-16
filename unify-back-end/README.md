# Unify shared backend

The web and mobile applications use one shared Supabase database. Its canonical database tooling lives in [`supabase/`](supabase/README.md).

The files under `src/database/` are incomplete historical schemas. They are frozen by checksum and must not be run or edited.

The canonical baseline is still being reconstructed from production. Do not use the Supabase Dashboard SQL Editor, `db push`, or `migration repair` until [`supabase/BASELINE_STATUS.md`](supabase/BASELINE_STATUS.md) marks the baseline ready.

Edge Functions are outside this directory's ownership and remain unchanged in their existing repositories.
