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
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Key Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start Expo dev server |
| `npm run ios` | Run on iOS |
| `npm run android` | Run on Android |
| `npm run web` | Run on web |
| `npm run lint` | Run ESLint |
| `npx tsc --noEmit` | TypeScript check |

## Backend Setup (Supabase)

### Using Supabase Cloud

1. Create a project at https://supabase.com
2. Get your `SUPABASE_URL` and `SUPABASE_ANON_KEY`
3. Run migrations in `unify-back-end/src/database/`

### Local Development

```bash
# Install Supabase CLI
npm install -g supabase

# Start local Supabase
cd unify-back-end
supabase start

# Push schema
supabase db push
```

## Database Schema

The main schema is in `unify-back-end/src/database/schema.sql`:

```bash
# Apply schema to Supabase
psql -h db.YOUR_PROJECT.supabase.co -U postgres -f schema.sql
```

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
│   └── supabase/      # Edge functions
├── unify-back-end/     # Backend (Supabase)
│   └── src/database/  # SQL schemas
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
