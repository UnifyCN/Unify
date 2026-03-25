import { StyleSheet, View, FlatList, Text } from 'react-native';
import { useRouter } from 'expo-router';
import BackHeader from '@/components/BackHeader';
import { DailyTipCard } from '@/components/tips/DailyTipCard';
import { DailyTip } from '@/types/dailyTip';
import { Theme } from '@/constants/Theme';
import { usePastTips } from '@/hooks/tips/usePastTips';
import { useCurrentUser } from '@/context/UserContext';
import { useOnboardingProfile } from '@/hooks/onboarding/useOnboardingProfile';
import EmptyFeedMessage from '@/components/profile/EmptyFeedMessage';
import { Feather } from '@expo/vector-icons';

const PastTipsScreen = () => {
  const router = useRouter();
  const { currentUser } = useCurrentUser();
  const { data: profile } = useOnboardingProfile(currentUser?.id);
  const { data: tips, isLoading } = usePastTips(
    profile?.persona ?? undefined,
    profile?.stage ?? undefined
  );

  const renderTipCard = ({ item }: { item: DailyTip }) => (
    <View style={styles.tipCardContainer}>
      <DailyTipCard
        tip={item}
        onPress={() =>
          router.push({
            pathname: '/tip-detail' as any,
            params: { tip: JSON.stringify(item) },
          })
        }
      />
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <BackHeader title='Past Tips' />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading tips...</Text>
        </View>
      </View>
    );
  }

  if (!tips || tips.length === 0) {
    return (
      <View style={styles.container}>
        <BackHeader title='Past Tips' />
        <View style={styles.emptyContainer}>
          <EmptyFeedMessage
            icon={<Feather name='sun' size={24} color='#B4B1B1' />}
            message='No tips yet'
            submessage={
              <Text
                style={{
                  fontSize: 14,
                  color: Theme.textInput,
                  textAlign: 'center',
                  lineHeight: 20,
                }}
              >
                Check back tomorrow for your first daily tip!
              </Text>
            }
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BackHeader title='Past Tips' />
      <FlatList
        data={tips}
        renderItem={renderTipCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.white,
  },
  listContent: {
    padding: 20,
    gap: 16,
  },
  tipCardContainer: {
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: Theme.textInput,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});

export default PastTipsScreen;
