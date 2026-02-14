# Unify - Technical Documentation

> Digital platform for newcomers in Canada

## Architecture Overview

Unify is a **monorepo** containing:
- `unify-front-end/` - React Native app (Expo)
- `unify-back-end/` - Backend services (Supabase)
- `.github/workflows/` - CI/CD pipelines

---

## Frontend (`unify-front-end/`)

### Tech Stack
- **Framework**: React Native with Expo (SDK 52)
- **Navigation**: Expo Router (file-based routing)
- **Language**: TypeScript
- **Styling**: StyleSheet (React Native default)
- **State Management**: React Context
- **Backend**: Supabase (Auth, Database, Storage, Edge Functions)

### Project Structure

```
unify-front-end/
├── app/                    # Expo Router pages
│   ├── (tabs)/            # Tab navigation
│   │   ├── index.tsx     # Home feed
│   │   ├── Learn/        # Learning modules
│   │   ├── Gather/       # Community/groups
│   │   ├── companion/    # AI chatbot
│   │   └── Checklist/   # Task tracking
│   ├── community-matching/ # Circle matching flow
│   ├── events.tsx       # Events listing
│   ├── profile.tsx      # User profile
│   └── onboarding.tsx   # New user onboarding
├── components/            # Reusable UI components
│   ├── AuthComponents/   # Login/signup forms
│   ├── ChatBot/         # AI chat UI
│   ├── home/            # Feed components
│   └── learn/           # Learning components
├── services/             # API layer (Supabase calls)
│   ├── feeds/           # Post/feed operations
│   ├── groups/          # Group management
│   ├── users/           # User profiles
│   ├── events/          # Event operations
│   ├── matching/        # Circle matching
│   ├── companion/       # AI companion
│   ├── progress/        # Learning progress
│   └── ...
├── supabase/
│   ├── functions/       # Edge functions (server-side)
│   └── migrations/      # Database migrations
├── context/             # React Context providers
├── hooks/               # Custom React hooks
├── lib/                 # Supabase client config
├── types/               # TypeScript definitions
└── utils/               # Helper functions
```

### Key Screens

| Screen | Route | Description |
|--------|-------|-------------|
| Home Feed | `(tabs)/index.tsx` | Main social feed |
| Learn | `(tabs)/Learn/` | Educational modules |
| Gather | `(tabs)/Gather/` | Community groups |
| Companion | `(tabs)/companion/` | AI chatbot |
| Profile | `profile.tsx` | User profile |
| Events | `events.tsx` | Event listings |
| Onboarding | `onboarding.tsx` | New user flow |

### Services Overview

Each service handles specific API operations:

- **feeds** - Posts, likes, comments, saves
- **groups** - Group CRUD, membership
- **users** - Profile management
- **events** - Event CRUD, RSVPs
- **matching** - Circle matching algorithm
- **companion** - AI chat, message rate limiting
- **progress** - Learning module progress
- **notifications** - Push notification handling
- **sanity** - CMS content fetching

---

## Backend (`unify-back-end/`)

### Tech Stack
- **Database**: PostgreSQL (via Supabase)
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage (S3)
- **Edge Functions**: Deno/TypeScript

### Database Schema

Core tables:

| Table | Purpose |
|-------|---------|
| `users` | User profiles (extends auth.users) |
| `posts` | Social posts |
| `post_likes` | Post like relationships |
| `post_comments` | Comments on posts |
| `groups` | Community groups |
| `group_members` | Group membership |
| `mainTopics` | Learning module topics |
| `subTopics` | Sub-topics within modules |
| `lessons` | Individual lessons |
| `lessonProgress` | User's lesson progress |
| `quizzes` | Quiz questions |
| `events` | Community events |
| `chatbotUsage` | AI chat rate limiting |
| `userFollowers` | Follower relationships |

### Database Functions (Triggers)

- `update_post_like_count` - Auto-updates post like count
- `update_comment_like_count` - Auto-updates comment like count  
- `update_group_member_count` - Auto-updates group member count

### RLS Policies

Row Level Security is enabled on all tables with policies for:
- Users can read/write their own data
- Public content is readable by all
- Premium features restricted by `is_premium` flag

---

## Configuration

### Environment Variables

Required in Supabase:
- `SUPABASE_URL` - Project URL
- `SUPABASE_ANON_KEY` - Anonymous key
- AI API keys (OpenAI, etc.) - stored in Edge Functions

### Supabase Config (`supabase/config.toml`)

- Auth configuration
- Database settings
- Storage buckets
- Edge function settings

### Expo Config (`app.json`)

- App name, version, icon
- Platform settings (iOS, Android)
- Push notification configuration

---

## CI/CD (GitHub Actions)

### Workflow: `.github/workflows/ci.yml`

**Triggers:**
- Push to `main`
- Pull requests to `main`

**Jobs:**
1. **Front-end CI**
   - Checkout code
   - Setup Node.js 18
   - Cache node_modules
   - Install dependencies
   - TypeScript type check (`npx tsc --noEmit`)
   - Build for iOS/Android (`npx expo export`)
   - Deploy (`npm run deploy`)

---

## Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI: `npm install -g @expo/cli`
- Supabase CLI (for local development)

### Local Development

```bash
# Clone and setup
git clone https://github.com/UnifyCN/Unify.git
cd Unify

# Frontend
cd unify-front-end
npm install
npx expo start

# Backend (Supabase local)
cd ../unify-back-end
supabase start
```

### Database Migrations

```bash
# Apply migrations
supabase db push

# Create new migration
supabase migration new migration_name
```

---

## Security

- **Auth**: Supabase Auth (email/password, OAuth)
- **API Keys**: Stored in Edge Functions, never exposed to client
- **RLS**: Row Level Security on all tables
- **Storage**: Bucket policies restrict file access
- **Input Validation**: Server-side validation in Edge Functions

---

## Related Repos

- `UnifyCN/unify-sanity` - Sanity CMS for content management
