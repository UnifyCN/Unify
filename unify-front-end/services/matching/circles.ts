import { supabase } from '@/lib/supabase';
import type {
  CommunityCircle,
  CommunityCircleMemberProfile,
  CommunityCircleMembership,
} from '@/types/matching';

export type { CommunityCircleMembership };

export const getActiveCircleMembership =
  async (): Promise<CommunityCircleMembership | null> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('community_circle_members')
      .select(
        `
        id,
        circle_id,
        user_id,
        joined_at,
        left_at,
        community_circles!inner(
          id,
          pool_key,
          persona,
          time_in_canada,
          goal,
          topics,
          match_metadata,
          created_at,
          ends_at,
          status
        )
      `
      )
      .eq('user_id', user.id)
      .is('left_at', null)
      .eq('community_circles.status', 'active')
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to load active circle: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    // Cast to any to handle joined data structure
    const row = data as any;
    const circle = row.community_circles;

    // Client-side guard: treat circles past their ends_at as inactive even
    // if the backend hasn't flipped the status yet (cron runs every 3 min).
    if (new Date(circle.ends_at) <= new Date()) {
      return null;
    }

    return {
      id: row.id,
      circle_id: row.circle_id,
      user_id: row.user_id,
      joined_at: row.joined_at,
      left_at: row.left_at,
      circle: {
        id: circle.id,
        pool_key: circle.pool_key,
        persona: circle.persona,
        time_in_canada: circle.time_in_canada,
        goal: circle.goal,
        topics: circle.topics || [],
        match_metadata: circle.match_metadata || null,
        created_at: circle.created_at,
        ends_at: circle.ends_at,
        status: circle.status,
      } as CommunityCircle,
    };
  };

export const getCircleById = async (
  circleId: string
): Promise<CommunityCircle | null> => {
  const { data, error } = await supabase
    .from('community_circles')
    .select(
      'id,pool_key,persona,time_in_canada,goal,topics,match_metadata,created_at,ends_at,status'
    )
    .eq('id', circleId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load circle: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  const circle = data as any;

  return {
    id: circle.id,
    pool_key: circle.pool_key,
    persona: circle.persona,
    time_in_canada: circle.time_in_canada,
    goal: circle.goal ?? null,
    topics: circle.topics || [],
    match_metadata: circle.match_metadata || null,
    created_at: circle.created_at,
    ends_at: circle.ends_at,
    status: circle.status,
  } as CommunityCircle;
};

export const getCircleMembers = async (
  circleId: string
): Promise<CommunityCircleMemberProfile[]> => {
  const { data, error } = await supabase
    .from('community_circle_members')
    .select(
      `
        id,
        user_id,
        circle_id,
        joined_at,
        left_at,
        users!inner(
          id,
          username,
          profile_picture_url
        )
      `
    )
    .eq('circle_id', circleId)
    .order('joined_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to load circle members: ${error.message}`);
  }

  return (
    data?.map(row => {
      const r = row as any;
      const user = r.users;
      return {
        id: r.id,
        circle_id: r.circle_id,
        user_id: r.user_id,
        joined_at: r.joined_at,
        left_at: r.left_at,
        user: {
          id: user.id,
          username: user.username,
          profile_picture_url: user.profile_picture_url,
        },
      };
    }) ?? []
  );
};

export const markCircleJoined = async (circleId: string) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('community_circle_members')
    .update({
      joined_at: new Date().toISOString(),
      left_at: null,
    })
    .eq('circle_id', circleId)
    .eq('user_id', user.id)
    .select('*');

  if (error) {
    throw new Error(`Failed to join circle chat: ${error.message}`);
  }
  if (!data || data.length === 0) {
    throw new Error(
      'No membership found to update - you may not be a member of this circle'
    );
  }
};

export const leaveCircle = async (circleId: string) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('community_circle_members')
    .update({
      left_at: new Date().toISOString(),
    })
    .eq('circle_id', circleId)
    .eq('user_id', user.id)
    .select('*');

  if (error) {
    throw new Error(`Failed to leave circle: ${error.message}`);
  }
  if (!data || data.length === 0) {
    throw new Error(
      'No membership found to update - you may not be a member of this circle'
    );
  }
};

export const getMembershipForCircle = async (
  circleId: string
): Promise<CommunityCircleMembership | null> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('community_circle_members')
    .select(
      `
        id,
        circle_id,
        user_id,
        joined_at,
        left_at,
        community_circles(
          id,
          pool_key,
          persona,
          time_in_canada,
          goal,
          topics,
          match_metadata,
          created_at,
          ends_at,
          status
        )
      `
    )
    .eq('circle_id', circleId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to load circle membership: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  // Cast to any to avoid deep instantiation TS errors on join properties
  const row = data as any;
  const circle = row.community_circles;

  if (!circle) {
    return null;
  }

  return {
    id: row.id,
    circle_id: row.circle_id,
    user_id: row.user_id,
    joined_at: row.joined_at,
    left_at: row.left_at,
    circle: {
      id: circle.id,
      pool_key: circle.pool_key,
      persona: circle.persona,
      time_in_canada: circle.time_in_canada,
      goal: circle.goal,
      topics: circle.topics || [],
      match_metadata: circle.match_metadata || null,
      created_at: circle.created_at,
      ends_at: circle.ends_at,
      status: circle.status,
    } as CommunityCircle,
  };
};
