import type { Persona, TimeInCanada } from './onboardingProfile';

export type CommunityWaitlistStatus = 'waiting' | 'matched' | 'paused';
export type CommunityCircleStatus = 'active' | 'ended';

export interface CommunityWaitlistEntry {
  id: string;
  user_id: string;
  persona: Persona;
  time_in_canada: TimeInCanada;
  pool_key: string;
  status: CommunityWaitlistStatus;
  created_at: string;
}

export interface CommunityCircle {
  id: string;
  pool_key: string;
  persona: Persona;
  time_in_canada: TimeInCanada;
  created_at: string;
  ends_at: string;
  status: CommunityCircleStatus;
}

export interface CommunityCircleMembership {
  id: string;
  circle_id: string;
  user_id: string;
  joined_at: string | null;
  left_at: string | null;
  circle: CommunityCircle;
}

export interface CommunityCircleMemberProfile {
  id: string;
  circle_id: string;
  user_id: string;
  joined_at: string | null;
  left_at: string | null;
  user: {
    id: string;
    username: string;
    profile_picture_url: string | null;
  };
}

export interface CommunityMessage {
  id: string;
  circle_id: string;
  sender_user_id: string | null;
  content: string;
  created_at: string;
  sender?: {
    id: string;
    username: string;
    profile_picture_url: string | null;
  } | null;
}

export type CommunityNotificationType =
  | 'circle_matched'
  | 'circle_ended'
  | 'circle_ending_soon';

export interface CommunityNotification {
  id: string;
  user_id: string;
  type: CommunityNotificationType;
  title: string;
  body: string;
  data: { circle_id?: string } | null;
  read_at: string | null;
  created_at: string;
}

