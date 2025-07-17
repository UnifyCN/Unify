import { AppState, Platform } from 'react-native';
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, processLock } from '@supabase/supabase-js';

const supabaseUrl = 'https://wrbauxutkysljmsqojts.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYmF1eHV0a3lzbGptc3FvanRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxOTY4MzMsImV4cCI6MjA2Nzc3MjgzM30.rB-q1BN2dPUcg8whhoBgkZJdt1rXTxX6JiDj16dkwdo';

// Create Supabase client only when running in React Native environment
const createSupabaseClient = () => {
  if (typeof window === 'undefined' || typeof Platform === undefined) { // Check if we're in a Node.js environment (build process) or React Native environment
    return {
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithPassword: () => Promise.resolve({ error: null }),
        signUp: () => Promise.resolve({ data: null, error: null }),
        signOut: () => Promise.resolve({ error: null }),
        verifyOtp: () => Promise.resolve({ data: { session: null }, error: null }),
        startAutoRefresh: () => {},
        stopAutoRefresh: () => {},
      },
    };
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      lock: processLock,
    },
  });
};

export const supabase = createSupabaseClient();

// Only add AppState listener when in React Native environment
if (typeof window !== 'undefined' && typeof Platform !== 'undefined') {
  AppState.addEventListener('change', state => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
