# Project: Unify

React Native / Expo project.

## Skills

- Always apply `vercel-react-native-skills` when working on React Native components, screens, navigation, animations, lists, or UI/performance code.
- **Frontend design:** Always invoke BOTH `frontend-design` AND `ui-ux-pro-max` skills together when changing any UI.

## Internationalization

The app supports multiple languages (currently en, es, hi, vi) and the list keeps expanding. Treat i18n as a hard requirement, not an afterthought.

When making ANY change that touches user-facing text — UI copy, alerts, button labels, error messages, placeholders, accessibility labels — follow these rules:

- **Never hardcode user-facing strings.** Use `t()` from `useTranslation()`.
- **Locale files live at `unify-front-end/i18n/locales/{lang}/translation.json`.** List the directory first (`ls unify-front-end/i18n/locales/`) — don't assume the locale set, new languages get added regularly.
- **Add every new key to ALL locale files in lockstep.** Provide a real translation per locale, not English copy-pasted everywhere.
- **Translations are nested by feature namespace** (e.g. `companion.welcomeTitle`, `auth.signIn`). Place new keys in the right namespace.
- **Before deleting a key**, grep the codebase (`grep -rn "namespace.keyName"`) to confirm no callers remain in any source file.
- **When renaming a key**, update all locale files in the same commit so they stay in sync.

## Commits

When committing, only stage files relevant to the change. Skip unrelated modifications (e.g. package-lock.json, build.gradle) unless they're part of the feature.

## Backend

- Supabase edge functions are in `unify-front-end/supabase/functions/`
- Moderator notification emails go to `contact@unifysocial.ca` via Resend API
- Legal documents are hosted on Notion — URLs are in `unify-front-end/utils/legalUrls.ts`

## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.
The skill has specialized workflows that produce better results than ad-hoc answers.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke office-hours
- Bugs, errors, "why is this broken", 500 errors → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Update docs after shipping → invoke document-release
- Weekly retro → invoke retro
- Design system, brand → invoke design-consultation
- Visual audit, design polish → invoke design-review
- Architecture review → invoke plan-eng-review
- Save progress, checkpoint, resume → invoke checkpoint
- Code quality, health check → invoke health
