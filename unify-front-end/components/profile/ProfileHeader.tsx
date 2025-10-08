import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { FollowButton } from './FollowButton';
import { UserInfo } from '@/services/users/getUserInfo';

interface ProfileHeaderProps {
  userInfo: UserInfo | undefined;
  isCurrentUser: boolean | null;
}

export const ProfileHeader = ({
  userInfo,
  isCurrentUser,
}: ProfileHeaderProps) => {
  if (!userInfo) {
    return (
      <View style={styles.container}>
        {/* Left Section - Loading User Info */}
        <View style={styles.leftSection}>
          {/* Loading Username */}
          <View
            style={[
              styles.loadingText,
              { width: 50, height: 24, marginBottom: 8 },
            ]}
          />

          {/* Loading Stats */}
          <View style={[styles.statsContainer, { marginBottom: 8 }]}>
            <View
              style={[
                styles.loadingText,
                { width: 15, height: 12, marginRight: 4, flexShrink: 0 },
              ]}
            />
            <View
              style={[
                styles.loadingText,
                { width: 40, height: 12, flexShrink: 0 },
              ]}
            />
            <View
              style={[
                styles.loadingText,
                { width: 8, height: 12, marginHorizontal: 4, flexShrink: 0 },
              ]}
            />
            <View
              style={[
                styles.loadingText,
                { width: 15, height: 12, marginRight: 4, flexShrink: 0 },
              ]}
            />
            <View
              style={[
                styles.loadingText,
                { width: 40, height: 12, flexShrink: 0 },
              ]}
            />
          </View>

          {/* Loading Follow/Edit Button */}
          <View
            style={[
              styles.loadingText,
              { width: 80, height: 24, marginTop: 8 },
            ]}
          />
        </View>

        {/* Right Section - Loading Profile Picture */}
        <View style={styles.rightSection}>
          <View style={styles.profilePictureContainer}>
            <View style={[styles.profilePicture, styles.loadingPlaceholder]}>
              <ActivityIndicator size='large' color='#666' />
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Left Section - User Info */}
      <View style={styles.leftSection}>
        <Text style={styles.username}>{userInfo.username}</Text>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <Text style={styles.statNumber}>{userInfo.followerCount} </Text>
          <Text style={styles.statLabel}>followers</Text>
          <Text style={styles.bullet}> • </Text>
          <Text style={styles.statNumber}>{userInfo.followingCount} </Text>
          <Text style={styles.statLabel}>following</Text>
        </View>

        {/* Follow Button or Edit Button */}
        {!isCurrentUser ? (
          <View style={styles.followButtonContainer}>
            <FollowButton targetUserId={userInfo.id} />
          </View>
        ) : (
          // TODO: Add edit display name functionality
          <View style={styles.followButtonContainer}>
            <TouchableOpacity style={styles.followButton}>
              <Text style={styles.followButtonText}>Edit Display Name</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Right Section - Profile Picture */}
      <View style={styles.rightSection}>
        <View style={styles.profilePictureContainer}>
          <View style={styles.profilePicture}>
            <Text style={styles.profilePictureText}>
              {userInfo.username.charAt(0).toUpperCase()}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 24,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  leftSection: {
    flex: 1,
  },
  rightSection: {
    alignItems: 'center',
  },
  profilePictureContainer: {
    marginBottom: 0,
  },
  profilePicture: {
    width: 93,
    height: 93,
    borderRadius: 46.5,
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
    alignItems: 'flex-start',
    marginBottom: 0,
  },
  username: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 2,
    color: '#000',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 12,
    color: '#000',
  },
  statLabel: {
    fontSize: 12,
    color: '#000',
  },
  bullet: {
    fontSize: 12,
    color: '#000',
    marginHorizontal: 4,
  },
  followButtonContainer: {
    alignSelf: 'flex-start',
    marginTop: 'auto',
  },
  followButton: {
    backgroundColor: '#333',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followButtonText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  loadingPlaceholder: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
  },
  loadingText: {
    backgroundColor: '#E5E5E5',
    borderRadius: 4,
  },
});
