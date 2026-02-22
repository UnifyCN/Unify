import { AppState } from 'react-native';
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, processLock } from '@supabase/supabase-js';

const supabaseUrl = 'https://wrbauxutkysljmsqojts.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYmF1eHV0a3lzbGptc3FvanRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxOTY4MzMsImV4cCI6MjA2Nzc3MjgzM30.rB-q1BN2dPUcg8whhoBgkZJdt1rXTxX6JiDj16dkwdo';

// supabase-js drops lockAcquireTimeout when forwarding auth options to GoTrueClient.
// Wrap processLock to enforce a longer timeout directly, preventing cascade failures on
// Android where many hooks call getUser()/getSession() concurrently on mount.
const LOCK_TIMEOUT_MS = 30_000;
const lock = (
  name: string,
  _acquireTimeout: number,
  fn: () => Promise<any>
) => {
  return processLock(name, LOCK_TIMEOUT_MS, fn);
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    lock,
  },
});

/**
 * Returns the authenticated user's ID using the cached session.
 * Prefer this over `supabase.auth.getUser()` for database queries —
 * getSession() reads from memory/storage (fast, minimal lock hold time)
 * while getUser() makes a network call (slow, blocks the lock queue).
 */
export async function getAuthUserId(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) {
    throw new Error('User not authenticated');
  }
  return session.user.id;
}

// Tells Supabase Auth to continuously refresh the session automatically
// if the app is in the foreground. When this is added, you will continue
// to receive `onAuthStateChange` events with the `TOKEN_REFRESHED` or
// `SIGNED_OUT` event if the user's session is terminated. This should
// only be registered once.
AppState.addEventListener('change', state => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
