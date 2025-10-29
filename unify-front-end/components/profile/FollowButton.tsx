import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useFollowUser } from '@/hooks/users/useFollowUser';
import { useFollowStatus } from '@/hooks/users/useFollowStatus';
import { Theme } from '@/constants/Theme';

interface FollowButtonProps {
  targetUserId: string;
}

export const FollowButton = ({ targetUserId }: FollowButtonProps) => {
  const { data: isFollowing, isLoading: isFollowStatusLoading } =
    useFollowStatus(targetUserId);
  const followUserMutation = useFollowUser();

  const handleFollowToggle = () => {
    followUserMutation.mutate({
      targetUserId,
      isFollowing: !isFollowing,
    });
  };

  if (isFollowStatusLoading) {
    return (
      <TouchableOpacity style={styles.button} disabled>
        <ActivityIndicator size='small' color='#fff' />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isFollowing ? styles.followingButton : styles.followButton,
      ]}
      onPress={handleFollowToggle}
      disabled={followUserMutation.isPending}
    >
      {followUserMutation.isPending ? (
        <ActivityIndicator size='small' color='#fff' />
      ) : (
        <Text style={styles.buttonText}>
          {isFollowing ? 'Unfollow' : 'Follow'}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 64,
  },
  followButton: {
    backgroundColor: Theme.primaryGatherRed,
  },
  followingButton: {
    backgroundColor: Theme.primaryGatherRed,
  },
  buttonText: {
    color: Theme.white,
    fontSize: 12,
    fontWeight: '600',
  },
});
