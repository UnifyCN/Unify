import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { FollowButton } from './FollowButton';
import { UserInfo } from '@/services/users/getUserInfo';
import { SkeletonLoader } from '@/components/SkeletonLoader';
import { ProfilePictureUpload } from './ProfilePictureUpload';
import { Avatar } from '@/components/Avatar';
import { Theme } from '@/constants/Theme';

interface ProfileHeaderProps {
  userInfo: UserInfo | undefined;
  isCurrentUser: boolean | null;
}

export const ProfileHeader = ({
  userInfo,
  isCurrentUser,
}: ProfileHeaderProps) => {
  const [modalVisible, setModalVisible] = useState(false);
  const router = useRouter();

  if (!userInfo) {
    return (
      <View style={styles.container}>
        {/* Left Section - Loading Profile Picture */}
        <View style={styles.avatarSection}>
          <SkeletonLoader
            width={80}
            height={80}
            borderRadius={40}
            style={styles.profilePicture}
          />
        </View>

        {/* Right Section - Loading User Info */}
        <View style={styles.infoSection}>
          <SkeletonLoader width={120} height={24} style={{ marginBottom: 8 }} />
          <View style={[styles.statsContainer, { marginBottom: 12 }]}>
            <SkeletonLoader width={80} height={16} style={{ marginRight: 16 }} />
            <SkeletonLoader width={80} height={16} />
          </View>
          <SkeletonLoader width={100} height={32} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Left Section - Profile Picture */}
      <View style={styles.avatarSection}>
        <View style={styles.profilePictureContainer}>
          <Avatar
            profilePictureUrl={userInfo.profilePictureUrl}
            username={userInfo.username}
            size={80}
            style={styles.profilePicture}
          />
          {isCurrentUser && (
            <>
              <TouchableOpacity
                style={styles.avatarButton}
                onPress={() => setModalVisible(true)}
              />
              <ProfilePictureUpload
                currentPictureUrl={userInfo.profilePictureUrl}
                userId={userInfo.id}
                modalVisible={modalVisible}
                onClose={() => setModalVisible(false)}
              />
            </>
          )}
        </View>
      </View>

      {/* Right Section - User Info */}
      <View style={styles.infoSection}>
        <Text style={styles.username}>{userInfo.username}</Text>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <TouchableOpacity style={styles.statItem}>
            <Text style={styles.statNumber}>{userInfo.followerCount}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statItem}>
            <Text style={styles.statNumber}>{userInfo.followingCount}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </TouchableOpacity>
        </View>

        {/* Action Button */}
        <View style={styles.actionButtonContainer}>
          {!isCurrentUser && isCurrentUser !== null && (
            <FollowButton
              targetUserId={userInfo.id}
              style={{ width: '65%' }}
            />
          )}
          {isCurrentUser && (
            <TouchableOpacity
              style={styles.editProfileButton}
              onPress={() => router.push('/account-settings')}
            >
              <Text style={styles.editProfileButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarSection: {
    marginRight: 20,
  },
  infoSection: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: 4, 
  },
  profilePictureContainer: {
    position: 'relative',
  },
  profilePicture: {
    borderWidth: 1,
    borderColor: '#F2F2F2',
  },
  avatarButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 40,
  },
  username: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
    lineHeight: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
    marginRight: 4,
  },
  statLabel: {
    fontSize: 15,
    color: '#666',
    fontWeight: '400',
  },
  actionButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  editProfileButton: {
    backgroundColor: '#F2F2F2',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  editProfileButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
});
