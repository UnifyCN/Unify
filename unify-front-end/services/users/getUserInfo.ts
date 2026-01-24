import { supabase } from '@/lib/supabase';
import { Permissions } from '@/types/permissions';
import { OnboardingStage } from '@/types/onboarding';
import dayjs from 'dayjs';

export interface UserInfo {
  id: string;
  username: string;
  createdAt: string;
  followingCount: number;
  followerCount: number;
  profilePictureUrl?: string;
  isPremium: boolean;
  permissions: string;
  arrivalDate: string;
  stage: OnboardingStage;
}

// Helper function for calculating stages
export function computeStage(arrivalDate: string | null): OnboardingStage {
  if (!arrivalDate) return 0;

  const arrival = dayjs(arrivalDate);
  const now = dayjs();
  const diffMonths = now.diff(arrival, 'month');

  if (diffMonths < 0) return 0; // Not arrived yet
  if (diffMonths < 3) return 1; // <3 months
  if (diffMonths < 12) return 2; // <1 year
  if (diffMonths < 36) return 3; // <3 years
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

    // Get user info
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(
        'id, username, created_at, profile_picture_url, is_premium, permissions'
      )
      .eq('id', targetUserId)
      .single();

    if (userError) {
      throw new Error(`Failed to fetch user info: ${userError.message}`);
    }

    // Get onboarding data
    const { data: onboardingData, error: onboardingError } = await supabase
      .from('user_onboarding_profiles')
      .select('arrival_date, stage')
      .eq('id', targetUserId)
      .maybeSingle();

    if (onboardingError) {
      throw new Error(
        `Failed to fetch onboarding profile: ${onboardingError.message}`
      );
    }

    const arrivalDate = onboardingData?.arrival_date ?? null;
    const receivedStage = onboardingData?.stage ?? 0;
    const computedStage = computeStage(arrivalDate);

    // If computed stage differs from stored stage, update it in the table
    if (receivedStage !== computedStage) {
      await supabase
        .from('user_onboarding_profiles')
        .update({ stage: computedStage })
        .eq('id', targetUserId);
    }

    // Get following count
    const { count: followingCount, error: followingError } = await supabase
      .from('user_followers')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', targetUserId);

    if (followingError) {
      throw new Error(
        `Failed to fetch following count: ${followingError.message}`
      );
    }

    // Get follower count
    const { count: followerCount, error: followerError } = await supabase
      .from('user_followers')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', targetUserId);

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
      stage: computedStage,
    };
  } catch (error) {
    console.error('Error fetching user info:', error);
    throw error;
  }
};
