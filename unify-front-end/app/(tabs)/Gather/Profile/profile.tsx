import { useLocalSearchParams } from 'expo-router';
import ProfilePageWrapper from '@/components/profile/ProfilePageWrapper';

export default function GatherProfilePage() {
  const { userId, tab } = useLocalSearchParams();
  return <ProfilePageWrapper userId={userId} tab={tab} />;
}
