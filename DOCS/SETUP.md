# Unify - Setup Guide

## Prerequisites

- **Node.js** v18 or higher
- **npm** or **yarn**
- **Git**
- **Expo CLI**: `npm install -g @expo/cli`
- **Supabase CLI** (optional, for local development): https://github.com/supabase/cli

## Clone the Repository

```bash
git clone https://github.com/UnifyCN/Unify.git
cd Unify
```

## Frontend Setup

```bash
cd unify-front-end

# Install dependencies
npm install

# Start development server
npx expo start

# Run on specific platform
npx expo start --ios    # iOS simulator
npx expo start --android # Android emulator
npx expo start --web    # Web browser
```

### Environment Configuration

Create a `.env` file (or set via Supabase dashboard):

```dotenv
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Key Scripts

| Script             | Description           |
| ------------------ | --------------------- |
| `npm start`        | Start Expo dev server |
| `npm run ios`      | Run on iOS            |
| `npm run android`  | Run on Android        |
| `npm run web`      | Run on web            |
| `npm run lint`     | Run ESLint            |
| `npx tsc --noEmit` | TypeScript check      |

## Backend Setup (Supabase)

### Using Supabase Cloud

The web and mobile applications use one existing shared Supabase project. Get the public URL and client key from the approved environment configuration; do not create or link an independent production database.

All database schema and migration work belongs in `unify-back-end/supabase/`. Read its `BASELINE_STATUS.md` before making a database change.

### Local Development

```bash
cd unify-back-end
npm ci

# Validate the database ownership and migration policy.
npm test
npm run db:validate
```

Local database startup/reset instructions will be enabled after the production-derived baseline is replayable. The Supabase CLI version is pinned in `unify-back-end/package.json` and locked in `unify-back-end/package-lock.json`; do not install an unrelated global version.

## Database Schema

The canonical schema will be replayed from `unify-back-end/supabase/migrations/` once the production-derived baseline is marked ready. Files under `unify-back-end/src/database/` are frozen historical references and must not be executed.

There is intentionally no direct `psql`, Dashboard SQL Editor, migration-repair, or production-push setup command. Production database changes require the protected shared-backend workflow.

## Deployment

### Frontend (EAS Build)

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure
eas build:configure

# Build for stores
eas build --platform ios
eas build --platform android
```

### CI/CD

GitHub Actions automatically runs on push to `main` and PRs:

- TypeScript check
- iOS/Android build
- See `.github/workflows/ci.yml`

## Project Structure Quick Reference

```
Unify/
├── unify-front-end/     # React Native (Expo) app
│   ├── app/            # Screens (Expo Router)
│   ├── services/       # API calls
│   ├── components/    # UI components
│   └── supabase/      # Edge functions and frozen legacy migrations
├── unify-back-end/     # Shared database owner
│   ├── supabase/      # Canonical migrations, policy, config, and DB tests
│   └── src/database/  # Frozen legacy SQL; do not add or edit
├── .github/workflows/  # CI/CD
└── DOCS/              # This documentation
```

## Troubleshooting

### Metro Bundler Issues

```bash
npx expo start --clear
```

### Reset Cache

```bash
npx expo start --reset-cache
```

### TypeScript Errors

```bash
npx tsc --noEmit
```

## Resources

- [Expo Docs](https://docs.expo.dev)
- [Supabase Docs](https://supabase.com/docs)
- [React Native Docs](https://reactnative.dev)
