# Shared database policy artifacts

These files describe the shared production database without containing production data or secrets.

- `baseline-state.json` is the machine-readable cutover state. `foundation` means the canonical migration directory must stay empty.
- `production-migrations.csv` records all production migration versions and how they relate to the frozen repository SQL.
- `legacy-database-files.sha256` freezes the previous mobile migration chain and handwritten backend schemas in place until they are archived with the completed baseline.

`source_status` values in the production ledger mean:

- `matched`: the repository file has the same 14-digit version and migration name.
- `mapped`: the repository source is identifiable, but its version or grouping differs from production.
- `remote_only`: no one-to-one repository source exists; production is the only authority.

The mapping is historical provenance, not permission to replay the legacy SQL.

The legacy freeze has no CI bypass. After a reviewed baseline is active, any
archive or deletion requires two separate owner-reviewed changes: first update
the policy and guard without touching legacy SQL, then change the legacy files
in a later PR under the approved replacement policy.
