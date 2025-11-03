import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useGroups } from '@/hooks/groups/useGroups';
import GroupCard from './GroupCard';
import { Group } from '@/types/groups';
import { saveRecentGroups } from '@/services/users/recentGroups';
import { supabase } from '@/lib/supabase';
import { SearchHeader } from '@/components/SearchHeader';

export default function MoreGroupsScreen() {
  const { q } = useLocalSearchParams();
  const searchQuery = (q as string) ?? '';
  const { data: groups } = useGroups();
  const router = useRouter();

  const filtered: Group[] = (groups ?? []).filter(g =>
    !searchQuery
      ? true
      : g.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleGroupPress = async (group: Group) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) return;
      const res = await saveRecentGroups(userId, group.id);
      if (res?.error) console.error('saveRecentGroups failed', res.error);
    } catch (e) {
      console.error('saveRecentGroups exception', e);
    }

    // Navigate to GroupDetailScreen
    router.push({
      pathname: '/(tabs)/Gather/GroupDetailScreen' as any,
      params: { group: JSON.stringify(group) },
    });
  };

  const renderGroup = ({ item }: { item: Group }) => {
    return (
      <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
        <GroupCard group={item} onPress={() => handleGroupPress(item)} />
      </View>
    );
  };

  return (
    <View style={styles.searchContainer}>
      <SearchHeader />

      <FlatList
        data={filtered}
        renderItem={renderGroup}
        keyExtractor={(i: Group) => String(i.id)}
        style={{ marginLeft: -20 }}
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    paddingTop: 20,
    paddingHorizontal: 20,
    flex: 1,
    backgroundColor: '#ffffffff',
  },
});
