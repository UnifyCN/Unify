import { supabase } from '../lib/supabase';
import { generateUsername } from './usernameGenerator';

/**
 * Ensures a public.users record exists for the given auth userId.
 * Consolidates check-and-insert logic with identical timestamps.
 * Handles username collisions by retrying with a new username.
 *
 * @throws Error if unable to create user record after retries or on critical failures
 */
export const createUserIfNotExists = async (
  userId: string,
  email: string
): Promise<void> => {
  // Validate required parameters
  if (!userId) {
    throw new Error('userId is required to create user record');
  }
  if (!email) {
    throw new Error(
      'email is required to create user record (UNIQUE constraint)'
    );
  }

  // 1. Check if user already exists in public.users
  const { data: existingUser, error: fetchError } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (fetchError) {
    console.error('Error checking user existence:', fetchError);
    throw new Error(
      `Database error checking user existence: ${fetchError.message}`
    );
  }

  if (existingUser) return;

  // 2. Retry loop for insertion (handles username collisions race conditions)
  const maxRetries = 5;
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    // Generate a unique username (verified against DB, but race condition possible)
    const username = await generateUsername();
    const timestamp = new Date().toISOString();

    // Insert the new user record
    const { error: insertError } = await supabase.from('users').insert({
      id: userId,
      email: email,
      username: username,
      permissions: 'user',
      created_at: timestamp,
      updated_at: timestamp,
    });

    if (!insertError) return; // Success

    // Handle Unique Violations (23505)
    if (insertError.code === '23505') {
      // If conflict is on ID (primary key), user exists -> Success (race condition resolved)
      if (
        insertError.message?.includes('users_pkey') ||
        insertError.details?.includes('Key (id)') ||
        insertError.details?.includes('id)=')
      ) {
        return;
      }

      // If conflict is on Email, user already exists with this email -> Success
      if (
        insertError.message?.includes('users_email_key') ||
        insertError.details?.includes('Key (email)') ||
        insertError.details?.includes('email)=')
      ) {
        return;
      }

      // If conflict is on Username, loop and try again with new username
      if (
        insertError.message?.includes('users_username_key') ||
        insertError.message?.includes('username') ||
        insertError.details?.includes('username')
      ) {
        console.warn(
          `Username collision for "${username}" during insert (attempt ${i + 1}/${maxRetries}), retrying...`
        );
        lastError = new Error(`Username collision: ${insertError.message}`);
        continue;
      }
    }

    // Non-unique-constraint error - log and throw
    console.error('Error creating public user record:', insertError);
    throw new Error(`Failed to create user record: ${insertError.message}`);
  }

  // Exhausted all retries due to username collisions
  console.error(
    'Failed to create user record after max retries due to username collisions'
  );
  throw (
    lastError || new Error('Failed to create user record after max retries')
  );
};
