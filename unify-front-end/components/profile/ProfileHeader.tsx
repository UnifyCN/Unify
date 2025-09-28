import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useUserInfo } from '@/hooks/users/useUserInfo';
import { FollowButton } from './FollowButton';

interface ProfileHeaderProps {
  userId: string;
  isCurrentUser: boolean;
}

export const ProfileHeader = ({ userId, isCurrentUser }: ProfileHeaderProps) => {
  const { data: userInfo, isLoading, error } = useUserInfo(userId);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color='#000' />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load profile</Text>
      </View>
    );
  }

  if (!userInfo) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Profile Picture Placeholder */}
      <View style={styles.profilePictureContainer}>
        <View style={styles.profilePicture}>
          <Text style={styles.profilePictureText}>
            {userInfo.username.charAt(0).toUpperCase()}
          </Text>
        </View>
      </View>

      {/* User Info */}
      <View style={styles.userInfoContainer}>
        <Text style={styles.username}>{userInfo.username}</Text>
        <Text style={styles.memberSince}>
          Member since {new Date(userInfo.createdAt).toLocaleDateString()}
        </Text>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{userInfo.followerCount}</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{userInfo.followingCount}</Text>
          <Text style={styles.statLabel}>Following</Text>
        </View>
      </View>

      {/* Follow Button */}
      {!isCurrentUser && (
        <View style={styles.followButtonContainer}>
          <FollowButton targetUserId={userId} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
  },
  loadingContainer: {
    backgroundColor: '#fff',
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    backgroundColor: '#fff',
    padding: 40,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#ff4444',
  },
  profilePictureContainer: {
    marginBottom: 20,
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E5E5E5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#D0D0D0',
  },
  profilePictureText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#666',
  },
  userInfoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  memberSince: {
    fontSize: 14,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 40,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  followButtonContainer: {
    marginTop: 20,
  }
});
