const path = require('path');

// Ensures .env is loaded when evaluating config (Metro also loads it, but this keeps `extra` in sync).
require('dotenv').config({ path: path.join(__dirname, '.env') });

const appJson = require('./app.json');

module.exports = {
  expo: {
    ...appJson.expo,
    extra: {
      ...appJson.expo.extra,
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
    },
  },
};
