import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LegalDocumentType } from '@/utils/legalUrls';
import { supabase } from '@/lib/supabase';
import BackHeader from '@/components/BackHeader';
import { Avatar } from '@/components/Avatar';
import { useState, useEffect } from 'react';
import { Feather } from '@expo/vector-icons';
import { Theme } from '@/constants/Theme';
import { ProfilePictureUpload } from '@/components/profile/ProfilePictureUpload';
import { useCurrentUser } from '@/context/UserContext';
import { useAnalytics } from '@/utils/analytics';
import { useQuery } from '@tanstack/react-query';
import { getProfilePictureUrl } from '@/services/s3/uploadProfilePicture';

export default function AccountSettingsPage() {
  const router = useRouter();
  const { currentUser } = useCurrentUser();
  const [modalVisible, setModalVisible] = useState(false);
  const { trackScreen } = useAnalytics();

  // Track screen view on mount
  useEffect(() => {
    trackScreen('Account Settings');
  }, [trackScreen]);

  const onLogout = async () => {
    try {
      await supabase.auth.signOut();
      // Let AuthWrapper handle the navigation
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  const handleGiveFeedback = () => {
    Linking.openURL('https://unify.userjot.com').catch(err =>
      console.error('Failed to open URL:', err)
    );
  };

  const settingsRows = [
    {
      title: 'View Profile',
      icon: 'user' as const,
      onPress: () => {
        if (currentUser?.id) {
          router.push(`/profile?userId=${currentUser.id}`);
        }
      },
    },
    {
      title: 'Saved Posts',
      icon: 'bookmark' as const,
      onPress: () => router.push('/saved'),
    },
    {
      title: 'Give Feedback',
      icon: 'star' as const,
      onPress: handleGiveFeedback,
    },
  ];

  // Note: pathname uses 'as any' because expo-router generates types at build time
  // and legal-document.tsx may not be included in the typed routes yet
  const legalRows = [
    {
      title: 'Privacy Policy',
      icon: 'file-text' as const,
      onPress: () =>
        router.push({
          pathname: '/legal-document' as any,
          params: { doc: 'privacyPolicy' satisfies LegalDocumentType },
        }),
    },
    {
      title: 'Community Guidelines',
      icon: 'users' as const,
      onPress: () =>
        router.push({
          pathname: '/legal-document' as any,
          params: { doc: 'communityGuidelines' satisfies LegalDocumentType },
        }),
    },
  ];

  const profilePictureKey = currentUser?.profilePictureUrl ?? null;

  const { data: signedProfileUrl } = useQuery({
    queryKey: ['profilePictureSignedUrl', profilePictureKey],
    enabled: !!profilePictureKey,
    queryFn: () => getProfilePictureUrl(profilePictureKey as string),
    staleTime: 4 * 60 * 1000,
  });

  return (
    <View style={styles.container}>
      <BackHeader title='Settings' onBack={() => router.back()} />
      <View style={styles.content}>
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <TouchableOpacity
              onPress={() => setModalVisible(true)}
              activeOpacity={0.8}
            >
              <Avatar
                profilePictureUrl={signedProfileUrl}
                username={currentUser?.username || ''}
                size={93}
                style={styles.avatar}
              />
            </TouchableOpacity>
            {currentUser && (
              <ProfilePictureUpload
                currentPictureUrl={currentUser.profilePictureUrl}
                userId={currentUser.id}
                modalVisible={modalVisible}
                onClose={() => setModalVisible(false)}
              />
            )}
            <TouchableOpacity
              style={styles.cameraButton}
              onPress={() => setModalVisible(true)}
            >
              <View style={styles.cameraIconContainer}>
                <Feather name='camera' size={18} color={Theme.white} />
              </View>
            </TouchableOpacity>
          </View>
          <View style={styles.userInfoContainer}>
            <TouchableOpacity
              style={styles.nameRow}
              onPress={() => router.push('/edit-name')}
              activeOpacity={0.7}
            >
              <Text style={styles.userName}>{currentUser?.username || ''}</Text>
              <Feather name='edit-3' size={20} color={Theme.black} />
            </TouchableOpacity>
            <Text style={styles.userEmail}>{currentUser?.email || ''}</Text>
          </View>
        </View>
        <View style={styles.rowsContainer}>
          <View style={styles.settingsCard}>
            {settingsRows.map((row, index) => (
              <TouchableOpacity
                key={index}
                style={styles.row}
                onPress={row.onPress}
              >
                <View style={styles.bookmarkIconContainer}>
                  <Feather name={row.icon} size={24} color={Theme.black} />
                </View>
                <Text style={styles.rowText}>{row.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.divider} />

          {/* Legal Section */}
          <Text style={styles.sectionTitle}>Legal</Text>
          <View style={styles.settingsCard}>
            {legalRows.map((row, index) => (
              <TouchableOpacity
                key={index}
                style={styles.row}
                onPress={row.onPress}
              >
                <View style={styles.bookmarkIconContainer}>
                  <Feather name={row.icon} size={24} color={Theme.black} />
                </View>
                <Text style={styles.rowText}>{row.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.divider} />

          <TouchableOpacity style={styles.row} onPress={onLogout}>
            <Text style={styles.rowText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 25,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    // No additional styles needed
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  cameraIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Theme.primaryGatherRed,
    borderWidth: 2,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfoContainer: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userName: {
    fontSize: 24,
    fontWeight: '600',
    color: Theme.black,
  },
  userEmail: {
    fontSize: 14,
    color: '#343434',
  },
  settingsCard: {
    flexDirection: 'column',
    gap: 15,
  },
  rowsContainer: {
    flexDirection: 'column',
    gap: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  bookmarkIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowText: {
    fontSize: 18,
    color: Theme.black,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e4e4e4',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.textInput,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
