import { supabase } from '@/lib/supabase';
import { Permissions } from '@/types/permissions';
import dayjs from 'dayjs';
import { StageNumber } from '@/types/checklist';
import { Persona } from '@/types/onboardingProfile';
import { getPublicOnboardingProfile } from '@/services/onboarding/getPublicOnboardingProfile';

export interface UserInfo {
  id: string;
  username: string;
  createdAt: string;
  followingCount: number;
  followerCount: number;
  profilePictureUrl?: string;
  isPremium: boolean;
  permissions: string;
  arrivalDate: string | null;
  city: string | null;
  province: string | null;
  stage: StageNumber;
  persona: Persona | null;
  personaOther: string | null;
}

// Helper function for calculating stages
export function computeStage(arrivalDate: string | null): StageNumber {
  if (!arrivalDate) return 0;

  const arrival = dayjs(arrivalDate);
  const now = dayjs();
  const diffMonths = now.diff(arrival, 'month');

  if (diffMonths < 0) return 0; // Not arrived yet
  if (diffMonths < 3) return 1; // <3 months
  if (diffMonths < 12) return 2; // <1 year
  if (diffMonths < 36)
    return 3; // <3 years
  else return 4; // 3+ years
}

export const getUserInfo = async (userId?: string): Promise<UserInfo> => {
  try {
    let targetUserId = userId;

    // If no userId provided, get current user's ID
    if (!targetUserId) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }
      targetUserId = user.id;
    }

    const [
      userResult,
      onboardingResult,
      followingCountResult,
      followerCountResult,
    ] = await Promise.all([
      supabase
        .from('users')
        .select(
          'id, username, created_at, profile_picture_url, is_premium, permissions'
        )
        .eq('id', targetUserId)
        .single(),
      supabase
        .from('user_onboarding_profiles')
        .select('arrival_date, stage, persona, persona_other, city, province')
        .eq('id', targetUserId)
        .maybeSingle(),
      supabase
        .from('user_followers')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', targetUserId),
      supabase
        .from('user_followers')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', targetUserId),
    ]);

    const userData = userResult.data;
    const userError = userResult.error;
    const onboardingData = onboardingResult.data;
    const onboardingError = onboardingResult.error;
    const followingCount = followingCountResult.count;
    const followingError = followingCountResult.error;
    const followerCount = followerCountResult.count;
    const followerError = followerCountResult.error;

    if (userError) {
      throw new Error(`Failed to fetch user info: ${userError.message}`);
    }
    if (!userData) {
      throw new Error('Failed to fetch user info: no user data returned');
    }

    if (onboardingError) {
      throw new Error(
        `Failed to fetch onboarding profile: ${onboardingError.message}`
      );
    }

    const resolvedOnboarding: {
      arrival_date: string | null;
      persona: Persona | null;
      persona_other: string | null;
      city: string | null;
      province: string | null;
      stage: StageNumber | null;
    } = {
      arrival_date: onboardingData?.arrival_date ?? null,
      persona: onboardingData?.persona ?? null,
      persona_other: onboardingData?.persona_other ?? null,
      city: onboardingData?.city ?? null,
      province: onboardingData?.province ?? null,
      stage:
        onboardingData?.stage !== undefined && onboardingData?.stage !== null
          ? onboardingData.stage
          : null,
    };

    if (!resolvedOnboarding.persona || !resolvedOnboarding.arrival_date) {
      const publicProfile = await getPublicOnboardingProfile(targetUserId);
      if (publicProfile) {
        resolvedOnboarding.persona = publicProfile.persona;
        resolvedOnboarding.persona_other = publicProfile.persona_other;
        resolvedOnboarding.arrival_date = publicProfile.arrival_date;
      }
    }

    const arrivalDate = resolvedOnboarding?.arrival_date ?? null;
    const receivedStage = resolvedOnboarding.stage;
    const computedStage = computeStage(arrivalDate);

    if (receivedStage !== null && receivedStage !== computedStage) {
      // Best-effort persistence inside a fire-and-forget IIFE — must not block
      // the outer profile fetch on auth lookup or DB write. The auth check
      // ensures we only update the row for the currently-authenticated user
      // (cross-user profile views would otherwise fire a guaranteed
      // RLS-denied UPDATE round-trip).
      void (async () => {
        try {
          const {
            data: { user: authUser },
          } = await supabase.auth.getUser();

          if (authUser?.id !== targetUserId) return;

          const { error } = await supabase
            .from('user_onboarding_profiles')
            .update({ stage: computedStage })
            .eq('id', targetUserId);

          if (error) {
            console.warn('Failed to update onboarding stage:', error.message);
          }
        } catch (error) {
          console.error('Unexpected onboarding stage update failure:', error);
        }
      })();
    }

    if (followingError) {
      throw new Error(
        `Failed to fetch following count: ${followingError.message}`
      );
    }

    if (followerError) {
      throw new Error(
        `Failed to fetch follower count: ${followerError.message}`
      );
    }

    return {
      id: userData.id,
      username: userData.username,
      createdAt: userData.created_at,
      followingCount: followingCount || 0,
      followerCount: followerCount || 0,
      profilePictureUrl: userData.profile_picture_url,
      isPremium: userData.is_premium ?? false,
      permissions: userData.permissions ?? Permissions.USER,
      arrivalDate,
      city: resolvedOnboarding?.city ?? null,
      province: resolvedOnboarding?.province ?? null,
      stage: computedStage,
      persona: resolvedOnboarding?.persona ?? null,
      personaOther: resolvedOnboarding?.persona_other ?? null,
    };
  } catch (error) {
    console.error('Error fetching user info:', error);
    throw error;
  }
};
