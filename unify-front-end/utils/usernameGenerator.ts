import generateRandomUsername from 'generate-random-username';
import { supabase } from '../lib/supabase';

/**
 * Generates a unique username that doesn't exist in the database.
 * Throws an error if unable to generate after multiple attempts or on DB errors.
 */
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
      // Last 5 tries: fallback with high-entropy random suffix (5 digits = 100,000 possibilities)
      const base = generateRandomUsername({
        capitalize: true,
        separator: '',
        digits: 0,
      }).substring(0, 9); // Shorten base to 9 chars to leave room for 5-digit suffix
      const suffix = Math.floor(Math.random() * 100000)
        .toString()
        .padStart(5, '0');
      username = `${base}${suffix}`;
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

    // Handle DB errors explicitly - don't silently continue
    if (error) {
      console.error('Database error checking username availability:', error);
      throw new Error(
        `Failed to check username availability: ${error.message}`
      );
    }

    // Username is available
    if (!data) {
      return username;
    }
  }

  throw new Error(
    'Failed to generate a unique username after multiple attempts'
  );
};
