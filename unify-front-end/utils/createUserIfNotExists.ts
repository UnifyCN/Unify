import { supabase } from '../lib/supabase';
import { generateUsername } from './usernameGenerator';

/**
 * Ensures a public.users record exists for the given auth userId.
 * Consolidates check-and-insert logic with identical timestamps.
 * Handles username collisions by retrying with a new username.
 *
 * @param userId - The auth user ID
 * @param email - The user's email address
 * @param options - Optional parameters for legal acceptance timestamps
 * @throws Error if unable to create user record after retries or on critical failures
 */
export const createUserIfNotExists = async (
  userId: string,
  email: string,
  options?: {
    privacyPolicyAcceptedAt?: string;
    communityGuidelinesAcceptedAt?: string;
  }
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

  // 1. Check if user already exists in public.users. We fetch the consent
  // columns too because the handle_new_user DB trigger creates the row at
  // auth.signUp time *without* timestamps, so the row can exist with nulls.
  // When that happens, we need to UPDATE rather than skip the consent persist.
  const { data: existingUser, error: fetchError } = await supabase
    .from('users')
    .select(
      'id, privacy_policy_accepted_at, community_guidelines_accepted_at'
    )
    .eq('id', userId)
    .maybeSingle();

  if (fetchError) {
    console.error('Error checking user existence:', fetchError);
    throw new Error(
      `Database error checking user existence: ${fetchError.message}`
    );
  }

  if (existingUser) {
    // Backfill consent timestamps if caller provided them and the row's
    // timestamps are currently null. Never overwrite an existing acceptance.
    const needsPrivacy =
      options?.privacyPolicyAcceptedAt &&
      !existingUser.privacy_policy_accepted_at;
    const needsGuidelines =
      options?.communityGuidelinesAcceptedAt &&
      !existingUser.community_guidelines_accepted_at;

    if (needsPrivacy || needsGuidelines) {
      const { error: updateError } = await supabase
        .from('users')
        .update({
          ...(needsPrivacy && {
            privacy_policy_accepted_at: options!.privacyPolicyAcceptedAt,
          }),
          ...(needsGuidelines && {
            community_guidelines_accepted_at:
              options!.communityGuidelinesAcceptedAt,
          }),
        })
        .eq('id', userId);

      if (updateError) {
        console.error('Error backfilling consent timestamps:', updateError);
        throw new Error(
          `Failed to record consent acceptance: ${updateError.message}`
        );
      }
    }
    return;
  }

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
      ...(options?.privacyPolicyAcceptedAt && {
        privacy_policy_accepted_at: options.privacyPolicyAcceptedAt,
      }),
      ...(options?.communityGuidelinesAcceptedAt && {
        community_guidelines_accepted_at: options.communityGuidelinesAcceptedAt,
      }),
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
