import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import Profile from '@/components/profile/Profile';

export default function ProfilePage() {
  const { userId, tab } = useLocalSearchParams<{
    userId?: string;
    tab?: string;
  }>();

  if (!userId) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <Profile userId={userId} initialTab={tab} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
