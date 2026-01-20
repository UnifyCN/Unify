import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useFollowUser } from '@/hooks/users/useFollowUser';
import { useFollowStatus } from '@/hooks/users/useFollowStatus';
import { Theme } from '@/constants/Theme';

interface FollowButtonProps {
  targetUserId: string;
  style?: StyleProp<ViewStyle>;
}

export const FollowButton = ({ targetUserId, style }: FollowButtonProps) => {
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
        styles.button,
        localIsFollowing ? styles.followingButton : styles.followButton,
        style,
      ]}
      onPress={handleFollowToggle}
      disabled={followUserMutation.isPending}
    >
      <Text style={styles.buttonText}>
        {localIsFollowing ? 'Unfollow' : 'Follow'}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 72,
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
});
