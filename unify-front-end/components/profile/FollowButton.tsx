import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useFollowUser } from '@/hooks/users/useFollowUser';
import { useFollowStatus } from '@/hooks/users/useFollowStatus';
import { Theme } from '@/constants/Theme';

interface FollowButtonProps {
  targetUserId: string;
  compact?: boolean;
  largeCompact?: boolean;
}

export const FollowButton = ({
  targetUserId,
  compact = false,
  largeCompact = false,
}: FollowButtonProps) => {
  const { data: isFollowing } = useFollowStatus(targetUserId);
  const followUserMutation = useFollowUser();

  // Local state to track follow status for immediate UI updates
  const [localIsFollowing, setLocalIsFollowing] = useState<boolean | null>(
    null
  );

  // Update local state when server data changes
  useEffect(() => {
    if (isFollowing !== undefined) {
      setLocalIsFollowing(isFollowing);
    }
  }, [isFollowing]);

  const handleFollowToggle = () => {
    // Immediately update local state for instant UI feedback
    setLocalIsFollowing(!localIsFollowing);

    followUserMutation.mutate({
      targetUserId,
      isFollowing: !localIsFollowing,
    });
  };

  return (
    <TouchableOpacity
      style={[
        compact
          ? largeCompact
            ? styles.buttonCompactLarge
            : styles.buttonCompact
          : styles.button,
        localIsFollowing ? styles.followingButton : styles.followButton,
      ]}
      onPress={handleFollowToggle}
      disabled={followUserMutation.isPending}
    >
      <Text
        style={
          compact
            ? largeCompact
              ? styles.buttonTextCompactLarge
              : styles.buttonTextCompact
            : styles.buttonText
        }
      >
        {localIsFollowing ? (compact ? 'Following' : 'Unfollow') : 'Follow'}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 64,
  },
  buttonCompact: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  buttonCompactLarge: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 112,
  },
  followButton: {
    backgroundColor: Theme.primaryGatherRed,
  },
  followingButton: {
    backgroundColor: Theme.primaryGatherRed,
  },
  buttonText: {
    color: Theme.white,
    fontSize: 14,
    fontWeight: '600',
  },
  buttonTextCompact: {
    color: Theme.white,
    fontSize: 13,
    fontWeight: '600',
  },
  buttonTextCompactLarge: {
    color: Theme.white,
    fontSize: 15,
    fontWeight: '700',
  },
});
