import generateRandomUsername from 'generate-random-username';
import { supabase } from '../lib/supabase';

export const generateUsername = async (): Promise<string> => {
  const maxLength = 15;
  const maxAttempts = 10;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let username: string;

    if (attempt < 5) {
      // First 5 tries: clean username (e.g. "CoolTiger1")
      username = generateRandomUsername({
        capitalize: true,
        separator: '',
        digits: 1,
      });
    } else {
      // Last 5 tries: fallback with random suffix (e.g. "CoolTiger123")
      const base = generateRandomUsername({
        capitalize: true,
        separator: '',
        digits: 0,
      }).substring(0, 10); // Shorten base to make room for suffix
      username = `${base}${Math.floor(Math.random() * 1000)}`;
    }

    // Ensure strict length limit
    if (username.length > maxLength) {
      username = username.substring(0, maxLength);
    }

    // Check availability in DB
    const { data, error } = await supabase
      .from('users')
      .select('username')
      .eq('username', username)
      .maybeSingle();

    if (!error && !data) {
      return username;
    }
  }

  throw new Error('Failed to generate a unique username after multiple attempts');
};
