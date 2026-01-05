import { supabase } from '../lib/supabase';
import { generateUsername } from './usernameGenerator';

/**
 * Ensures a public.users record exists for the given auth userId.
 * Consolidates check-and-insert logic with identical timestamps.
 * Handles username collisions by retrying with a new username.
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

    if (existingUser) return;

    // 2. Retry loop for insertion (handles username collisions race conditions)
    const maxRetries = 3;
    for (let i = 0; i < maxRetries; i++) {
      try {
        // Generate a unique username (verified against DB, but race condition possible)
        const username = await generateUsername();
        const timestamp = new Date().toISOString();

        // Insert the new user record
        const { error: insertError } = await supabase.from('users').insert({
          id: userId,
          email: email || '',
          username: username,
          created_at: timestamp,
          updated_at: timestamp,
        });

        if (!insertError) return; // Success

        // Handle Unique Violations (23505)
        if (insertError.code === '23505') {
          // If conflict is on ID (primary key), user exists -> Success (race condition resolved)
          // We check message/details for 'users_pkey' or 'id'
          if (
            insertError.message?.includes('users_pkey') ||
            insertError.details?.includes('Key (id)') ||
            insertError.details?.includes('id)=')
          ) {
            return;
          }

          // If conflict is on Username, loop and try again with new username
          if (
            insertError.message?.includes('username') ||
            insertError.details?.includes('username')
          ) {
            console.warn(`Username collision for ${username} during insert, retrying...`);
            continue;
          }
        }

        // Log other errors and stop
        console.error('Error creating public user record:', insertError);
        return;
      } catch (genError) {
        console.error('Error generating username:', genError);
        // If we can't generate a username, we can't proceed
        return;
      }
    }
    
    console.error('Failed to create user record after max retries due to username collisions');
  } catch (error) {
    console.error('Unexpected error in createUserIfNotExists:', error);
  }
};
