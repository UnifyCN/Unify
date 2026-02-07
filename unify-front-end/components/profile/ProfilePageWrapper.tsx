import { StyleSheet, Text, View } from 'react-native';
import Profile from '@/components/profile/Profile';
import { Theme } from '@/constants/Theme';

interface ProfilePageWrapperProps {
  userId?: string | string[];
  tab?: string | string[];
}

export default function ProfilePageWrapper({
  userId,
  tab,
}: ProfilePageWrapperProps) {
  const normalizedUserId = Array.isArray(userId) ? userId[0] : userId;
  const normalizedTab = Array.isArray(tab) ? tab[0] : tab;

  if (!normalizedUserId) {
    return (
      <View style={styles.container}>
        <Text style={styles.messageText}>Invalid profile link</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Profile userId={normalizedUserId} initialTab={normalizedTab} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  messageText: {
    marginTop: 24,
    textAlign: 'center',
    fontSize: 16,
    color: Theme.textInput,
  },
});
