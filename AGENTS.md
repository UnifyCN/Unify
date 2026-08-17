# AGENTS

## Workflows

- Front-end app lives in `unify-front-end`.
- Shared database tooling lives in `unify-back-end/supabase` and is authoritative for both web and mobile.
- Edge Functions remain in their existing repositories and are outside the shared-database ownership rule.
- `unify-front-end/supabase/migrations` and `unify-back-end/src/database` are frozen legacy SQL, not deployment sources.
- PR titles in git history generally include the PR number suffix (example: `(#184)`).

## UI/UX Standard

- All frontend UI/UX changes must prioritize a minimal, aesthetic, and premium feel.
- In this project, "premium", "minimal", and "aesthetic" mean a native iOS Apple look by default unless explicitly stated otherwise.
- Favor simplicity, restraint, and visual clarity in every component, layout, and interaction.
- Do not add unnecessary elements, visual noise, or styling that is "extra" without clear UX value.
- Keep visual and interaction decisions deliberate and consistent across screens.
- Treat UI quality and user experience as first-class priorities for this project.

## Commands

### Front-end (from `unify-front-end/package.json`)

- `npm run start` (Expo dev server)
- `npm run android` (Expo Android)
- `npm run ios` (Expo iOS)
- `npm run web` (Expo web)
- `npm run test` (Jest watch mode)
- `npm run lint` (Expo lint)
- `npm run format` (Prettier)
- `npm run reset-project` (reset script)
- `npm run deploy` (placeholder; script not set up)
- `npx tsc --noEmit` (TypeScript check used in CI)
- `npx expo export --platform ios --platform android` (native export build used in CI)

### Back-end (from `unify-back-end/package.json`)

- `npm run dev` (nodemon + ts-node entry)
- `npm run build` (TypeScript build)
- `npm run start` (run compiled `dist/index.js`)
- `npm test` / `npm run db:validate:test` (database policy tests)
- `npm run db:validate` (database ownership and migration validation)
- `npm run db:new -- <snake_case_name>` (create a migration after baseline activation)

## TODO

- Finish the production-derived shared database baseline before enabling reset, pgTAP, or deployment workflows.
- Confirm whether PR checklist expectations from `.github/pull_request_template.md` should be mirrored here verbatim.
