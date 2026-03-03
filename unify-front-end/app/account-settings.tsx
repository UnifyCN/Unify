import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Pressable,
  Modal,
  Alert,
  ScrollView,
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
import { useHapticsPreference } from '@/context/HapticsContext';

const ACCOUNT_ROW_DANGER_COLOR = '#FF3B30';

export default function AccountSettingsPage() {
  const router = useRouter();
  const { currentUser } = useCurrentUser();
  const [modalVisible, setModalVisible] = useState(false);
  const [deleteAccountModalVisible, setDeleteAccountModalVisible] =
    useState(false);
  const { trackScreen } = useAnalytics();
  const { hapticsEnabled, setHapticsEnabled } = useHapticsPreference();

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

  const toggleHaptics = () => {
    setHapticsEnabled(!hapticsEnabled);
  };

  const deleteAccount = async () => {
    try {
      const { error } = await supabase.rpc('delete_user');
      if (error) throw error;
      setDeleteAccountModalVisible(false);
      Alert.alert(
        'Account deleted',
        'Your Unify account has been permanently deleted.',
        [{ text: 'OK', onPress: () => supabase.auth.signOut() }]
      );
    } catch (err) {
      console.error('Delete account failed', err);
      Alert.alert(
        'Could not delete account',
        err instanceof Error
          ? err.message
          : 'Something went wrong. Please try again.'
      );
    }
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
    {
      title: 'Terms of Service',
      icon: 'book-open' as const,
      onPress: () =>
        router.push({
          pathname: '/legal-document' as any,
          params: { doc: 'termsOfService' satisfies LegalDocumentType },
        }),
    },
  ];

  const accountRows = [
    {
      title: 'Log Out',
      icon: 'log-out' as const,
      onPress: onLogout,
    },
    {
      title: 'Delete account',
      icon: 'trash-2' as const,
      onPress: () => setDeleteAccountModalVisible(true),
    },
  ];

  return (
    <View style={styles.container}>
      <BackHeader title='Settings' onBack={() => router.back()} />
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <TouchableOpacity
              onPress={() => setModalVisible(true)}
              activeOpacity={0.8}
            >
              <Avatar
                profilePictureUrl={currentUser?.profilePictureUrl}
                username={currentUser?.username || ''}
                size={93}
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

          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.settingsCard}>
            <View style={[styles.row, styles.toggleRow]}>
              <View style={styles.rowLabelContainer}>
                <View style={styles.bookmarkIconContainer}>
                  <Feather name='zap' size={24} color={Theme.black} />
                </View>
                <Text style={styles.rowText}>Haptics</Text>
              </View>
              <Pressable
                onPress={toggleHaptics}
                accessibilityRole='switch'
                accessibilityState={{ checked: hapticsEnabled }}
                accessibilityLabel='Haptics'
                hitSlop={8}
                style={[
                  styles.toggleTrack,
                  hapticsEnabled ? styles.toggleTrackOn : styles.toggleTrackOff,
                ]}
              >
                <View style={styles.toggleThumb} />
              </Pressable>
            </View>
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

          {/* Account Section */}
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.settingsCard}>
            {accountRows.map((row, index) => (
              <TouchableOpacity
                key={index}
                style={styles.row}
                onPress={row.onPress}
              >
                <View style={styles.bookmarkIconContainer}>
                  <Feather
                    name={row.icon}
                    size={24}
                    color={ACCOUNT_ROW_DANGER_COLOR}
                  />
                </View>
                <Text style={styles.rowTextDanger}>{row.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Delete account confirmation modal */}
      <Modal
        animationType='fade'
        transparent
        visible={deleteAccountModalVisible}
        onRequestClose={() => setDeleteAccountModalVisible(false)}
      >
        <Pressable
          style={styles.deleteModalOverlay}
          onPress={() => setDeleteAccountModalVisible(false)}
        >
          <View style={styles.deleteModalCard}>
            <Pressable onPress={e => e.stopPropagation()}>
              <Text style={styles.deleteModalTitle}>
                Delete your Unify account?
              </Text>
              <Text style={styles.deleteModalMessage}>
                You're requesting to delete your account. This includes all your
                posts, comments, likes, and saves.
              </Text>
              <View style={styles.deleteModalButtons}>
                <TouchableOpacity
                  style={styles.deleteModalCancel}
                  onPress={() => setDeleteAccountModalVisible(false)}
                >
                  <Text style={styles.deleteModalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteModalConfirm}
                  onPress={deleteAccount}
                >
                  <Text style={styles.deleteModalConfirmText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
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
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    gap: 25,
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  avatarContainer: {
    position: 'relative',
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
  toggleRow: {
    justifyContent: 'space-between',
  },
  rowLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  toggleTrack: {
    width: 52,
    height: 30,
    borderRadius: 999,
    padding: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleTrackOn: {
    backgroundColor: Theme.primaryGatherRed,
    justifyContent: 'flex-end',
  },
  toggleTrackOff: {
    backgroundColor: Theme.surfaceGray,
    justifyContent: 'flex-start',
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Theme.white,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 2,
  },
  bookmarkIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowText: {
    fontSize: 18,
    color: Theme.black,
  },
  rowTextDanger: {
    fontSize: 18,
    color: ACCOUNT_ROW_DANGER_COLOR,
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
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  deleteModalCard: {
    backgroundColor: Theme.white,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Theme.black,
    marginBottom: 12,
  },
  deleteModalMessage: {
    fontSize: 16,
    color: Theme.textInput,
    lineHeight: 22,
    marginBottom: 24,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  deleteModalCancel: {
    paddingVertical: 12,
    width: '50%',
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Theme.surfaceTextInput,
    alignItems: 'center',
  },
  deleteModalCancelText: {
    fontSize: 16,
    color: Theme.black,
    fontWeight: '500',
  },
  deleteModalConfirm: {
    width: '50%',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteModalConfirmText: {
    fontSize: 16,
    color: Theme.white,
    fontWeight: '600',
  },
});
