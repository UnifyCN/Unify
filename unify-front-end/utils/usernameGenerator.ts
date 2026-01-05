import generateRandomUsername from 'generate-random-username';
import { supabase } from '../lib/supabase';

export const generateUsername = async (): Promise<string> => {
  const maxLength = 15; // Maximum allowed length
  const maxAttempts = 10; // Prevent infinite loops

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const username = generateRandomUsername({
      capitalize: true,
      separator: '',
      digits: 1,
    });

    // Check if username is within our length limit
    if (username.length <= maxLength) {
      // Check if username already exists in the database
      const { data, error } = await supabase
        .from('users')
        .select('username')
        .eq('username', username)
        .maybeSingle();

      if (!error && !data) {
        return username;
      }
    }
  }

  // Fallback: if we can't generate a unique short enough username, add a random suffix
  const fallbackUsername = generateRandomUsername({
    capitalize: true,
    separator: '',
    digits: 0,
  }).substring(0, 10);
  
  return `${fallbackUsername}${Math.floor(Math.random() * 1000)}`;
};
