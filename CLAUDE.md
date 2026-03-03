# Project: Unify

This is a React Native / Expo project.

## Skills

- Always apply the `vercel-react-native-skills` skill when working on React Native components, screens, navigation, animations, lists, or any UI/performance-related code.

## 2. Reduce hallucinations

Never speculate about code you have not opened. If the user references a specific file, you must read the file before answering. Make sure to investigate and read relevant files before answering questions about the codebase. Never make any claims about code before investigating unless you are certain of the correct answer. Give grounded and hallucination-free answers.

## 3. Design

Always use the design skill when changing the UI (frontend-design)

## 4. Commits

When committing, only stage files relevant to the change. Skip unrelated modifications (e.g. package-lock.json, build.gradle) unless they're part of the feature.

## 5. Backend

- Supabase edge functions are in `unify-front-end/supabase/functions/`
- Moderator notification emails go to `contact@unifysocial.ca` via Resend API
- Legal documents are hosted on Notion — URLs are in `unify-front-end/utils/legalUrls.ts`
