import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import Profile from '@/components/profile/Profile';

export default function ProfilePage() {
  const { userId, tab } = useLocalSearchParams<{
    userId: string;
    tab?: string;
  }>();

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <Profile userId={userId} initialTab={tab} />
    </View>
  );
}
