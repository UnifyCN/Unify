# AGENTS

## Workflows
- Front-end app lives in `unify-front-end`.
- Back-end service lives in `unify-back-end`.
- Recent PRs are mostly front-end scoped (`unify-front-end/*`), with occasional Supabase updates under `unify-front-end/supabase/*`.
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
- `npm run supabase` (Supabase CLI)

## TODO
- Confirm current DB workflow for Supabase migrations/functions (recent PRs touched `unify-front-end/supabase/migrations` and `unify-front-end/supabase/functions`).
- Confirm whether PR checklist expectations from `.github/pull_request_template.md` should be mirrored here verbatim.
