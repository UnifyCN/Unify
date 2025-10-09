# UNIFY
Enactus SFU Social Media App!

A React Native app built with Expo, connecting directly to Supabase for backend services.

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd unify-front-end
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npx expo start
   ```

4. **Run on your preferred platform**:
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Press `w` for web browser
   - Scan QR code with Expo Go app on your phone

## Project Structure

```
unify-front-end/
├── app/                    # Expo Router app directory
│   ├── (tabs)/            # Tab navigation screens
│   │   ├── index.tsx      # Home feed
│   │   ├── Learn/         # Learning modules
│   │   └── Profile/       # User profile
│   └── _layout.tsx        # Root layout
├── components/            # Reusable UI components
│   ├── AuthComponents/    # Authentication components
│   ├── ChatBot/          # AI chat functionality
│   ├── home/             # Home feed components
│   └── learn/            # Learning components
├── hooks/                # Custom React hooks
├── lib/                  # Library configurations
│   └── supabase.ts       # Supabase client setup
├── services/             # API service functions
├── supabase/             # Supabase configuration
│   └── functions/        # Edge functions
├── types/                # TypeScript type definitions
└── utils/                # Utility functions
```

## Development

### Available Scripts
- `npm start` - Start Expo development server
- `npm run android` - Run on Android
- `npm run ios` - Run on iOS
- `npm run web` - Run on web
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run format` - Run Prettier on the entire repo

## Security
- API keys stored securely in Supabase environment variables
- No sensitive data exposed to client-side
- Edge functions handle all AI API calls server-side
- Supabase Row Level Security (RLS) for data protection
