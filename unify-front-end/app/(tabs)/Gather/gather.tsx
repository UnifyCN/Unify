import { memo } from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { EventsCarousel } from '@/components/EventsCarousel';
import Header from '@/components/Header';
import GroupCard from './GroupCard';
import { getUserJoinedGroups } from '@/services/groups/getUserJoinedGroups';
import { useQuery } from '@tanstack/react-query';
import { Group } from '@/types/groups';
import { GroupCardSkeletonLoader } from '@/components/groups/GroupCardSkeletonLoader';
import { NewsCarousel } from '@/components/news/NewsCarousel';

const GroupsForYouSection = () => {
  const router = useRouter();

  const { data: groups, isLoading } = useQuery({
    queryKey: ['joined-groups'],
    queryFn: getUserJoinedGroups,
  });

  const handleGroupPress = (group: Group) => {
    router.push({
      pathname: '/(tabs)/Gather/GroupDetailScreen' as any,
      params: { group: JSON.stringify(group) },
    });
  };

  if (isLoading) {
    return (
      <View style={styles.section}>
        <View style={styles.groupsList}>
          {[1, 2, 3].map(i => (
            <View key={i} style={styles.groupItem}>
              <GroupCardSkeletonLoader />
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (!groups || groups.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.headerText}>Groups for You</Text>
      </View>
      <View style={styles.groupsList}>
        {groups.map(group => (
          <View key={group.id} style={styles.groupItem}>
            <GroupCard group={group} onPress={() => handleGroupPress(group)} />
          </View>
        ))}
      </View>
    </View>
  );
};

const GatherHeader = memo(() => {
  return (
    <View style={styles.eventsCarousel}>
      <EventsCarousel title='Community Events' titleStyle={styles.headerText} />
    </View>
  );
});

export default function GatherScreen() {
  return (
    <View style={styles.root}>
      <Header />
      <View style={styles.container}>
        <StatusBar style='dark' />
        <ScrollView style={styles.scrollView}>
          <GatherHeader />
          <NewsCarousel />
          <GroupsForYouSection />
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  searchButton: {
    marginHorizontal: 20,
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 100,
    height: 36,
  },
  searchPlaceholder: {
    fontSize: 14,
  },
  headerText: {
    fontSize: 24,
    fontWeight: '400',
  },
  eventsCarousel: {
    marginTop: 27,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 24,
    color: '#000',
    fontWeight: '600',
  },
  groupsList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  groupItem: {
    marginBottom: 12,
  },
});
