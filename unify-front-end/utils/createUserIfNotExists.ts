import { supabase } from '../lib/supabase';
import { generateUsername } from './usernameGenerator';

/**
 * Ensures a public.users record exists for the given auth userId.
 * Consolidates check-and-insert logic with identical timestamps.
 */
export const createUserIfNotExists = async (
  userId: string,
  email?: string | null
): Promise<void> => {
  try {
    // 1. Check if user already exists in public.users
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (fetchError) {
      console.error('Error checking user existence:', fetchError);
      return;
    }

    if (!existingUser) {
      // 2. Generate a unique username (handles collisions internally)
      const username = await generateUsername();
      
      // 3. Create a single timestamp for both fields
      const timestamp = new Date().toISOString();

      // 4. Insert the new user record
      const { error: insertError } = await supabase.from('users').insert({
        id: userId,
        email: email || '',
        username: username,
        created_at: timestamp,
        updated_at: timestamp,
      });

      if (insertError) {
        // If it was a race condition and the user was created meanwhile, handle it
        if (insertError.code === '23505') {
          return;
        }
        console.error('Error creating public user record:', insertError);
      }
    }
  } catch (error) {
    console.error('Unexpected error in createUserIfNotExists:', error);
  }
};

