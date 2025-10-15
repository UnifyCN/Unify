import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useMemo, useState, useEffect } from 'react';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Group } from '@/types/groups';
import { useGroups } from '@/hooks/groups/useGroups';
import GroupCard from './GroupCard';
import { PostData } from '@/types/feeds/post';
import { PostItem } from '@/components/home/PostItem';
import { useQuery } from '@tanstack/react-query';
import { getAllPosts } from '@/services/posts/getAllPosts';
import {
  saveRecentSearch,
  getRecentSearches,
} from '@/services/users/recentSearches';
import {
  saveRecentGroups,
  getRecentGroups,
} from '@/services/users/recentGroups';
import { supabase } from '@/lib/supabase';

export const navigationOptions = {
  headerShown: false,
};

const SearchScreen = () => {
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const { data: groups } = useGroups();
  const [recentGroups, setRecentGroups] = useState<Group[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['searchPosts', searchQuery],
    queryFn: () => getAllPosts(undefined, 50, searchQuery),
    enabled: !!searchQuery,
  });

  const postsToShow = searchResults?.posts ?? [];
  let searchHistory = null;
  let groupsHistory = null;

  useEffect(() => {
    const loadRecent = async () => {
      setLoadingData(true);
      try {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id;
        if (!userId) return;

        const { searches } = await getRecentSearches(userId);
        setRecentSearches(searches);

        const { groups: recentGroupIds } = await getRecentGroups(userId);
        if (recentGroupIds && groups) {
          const mapped = (recentGroupIds as number[])
            .map(id => groups.find(group => Number(group.id) === Number(id)))
            .filter(Boolean) as Group[];
          setRecentGroups(mapped);
        }
      } catch (err) {
        console.error('loading error', err);
      } finally {
        setLoadingData(false);
      }
    };
    loadRecent();
  }, [groups]);

  const handleSend = async (value?: string) => {
    const rawInput = (typeof value === 'string' ? value : searchInput) ?? '';
    const input = rawInput.trim();

    if (!input) {
      setSearchQuery('');
      return;
    }

    setSearchQuery(input);
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) return;

    const res = await saveRecentSearch(userId, input);
    if (res?.error) {
      console.error('saveRecentSearch failed', res.error);
      return;
    }

    setRecentSearches(prev => {
      const updated = [input, ...prev.filter(s => s !== input)];
      return updated;
    });
  };

  const filterGroups = useMemo(() => {
    return groups?.filter(group => {
      const matchesSearch = group.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [groups, searchQuery]);

  let foundGroup = filterGroups && filterGroups.length > 0;
  let foundPost = searchQuery
    ? (searchResults?.posts?.length ?? 0) > 0
    : postsToShow.length > 0;

  const groupPress = async (group: Group) => {
    setRecentGroups(prev => [
      group,
      ...prev.filter(tempGroup => tempGroup.id !== group.id),
    ]);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (userId) {
        const res = await saveRecentGroups(userId, Number(group.id));
        if (res?.error) console.error('saveRecentGroups failed', res.error);
      }
    } catch (e) {
      console.error('saveRecentGroups exception', e);
    }
  };

  const renderPosts = ({ item }: { item: PostData }) => (
    <View style={styles.cardItem}>
      <PostItem
        post={item}
        //TODO: CREATION OF A POST SCREEN
        //onPress={() => groupPress(item)}
      />
    </View>
  );
  const renderGroup = ({ item }: { item: Group }) => (
    <View style={styles.cardItem}>
      <GroupCard group={item} onPress={() => groupPress(item)} />
    </View>
  );

  if (
    recentSearches.length > 0 &&
    !(searchInput.trim().length > 0 && !searchQuery)
  ) {
    // user is typing but hasn't submitted yet — show the helper frame
    searchHistory = (
      <View style={{ marginTop: 10 }}>
        <Text style={styles.emptyHeadline}>RECENT SEARCHES</Text>
        {recentSearches.map((recentSearch, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => {
              setSearchInput(recentSearch);
              handleSend(recentSearch);
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 6,
              }}
            >
              <Feather
                name='search'
                size={16}
                color='#666'
                style={{ marginRight: 8 }}
              />
              <Text style={{ color: '#333', fontSize: 14 }}>
                {recentSearch}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  } else {
    searchHistory = (
      <View style={styles.searchFrame}>
        <Text style={styles.containerText}>
          What do you want to discover today? Press 'enter' or 'go' to see
          relevant groups or posts
        </Text>
      </View>
    );
  }

  if (recentGroups.length > 0 && searchInput.trim().length === 0) {
    groupsHistory = (
      <View>
        <Text style={styles.emptyHeadline}>RECENTLY VIEWED GROUPS</Text>
        {recentGroups.map(group => (
          <View style={styles.cardItem} key={group.id}>
            <GroupCard group={group} onPress={() => groupPress(group)} />
          </View>
        ))}
      </View>
    );
  }

  return (
    <View
      style={[
        styles.searchContainer,
        { backgroundColor: '#ffffffff', paddingTop: 0 },
      ]}
    >
      <View style={[styles.header, { paddingTop: 0 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name='chevron-left' size={24} color='#000' />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Search</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.searchInputContainer}>
        <Feather
          name='search'
          size={20}
          color='#666'
          style={styles.searchIcon}
        />
        <TextInput
          value={searchInput}
          onChangeText={text => {
            setSearchInput(text);
          }}
          style={styles.searchInput}
          //in figma says events and groups but this screen doesnt check events
          placeholder='Search for posts and groups near you'
          onSubmitEditing={() => handleSend()}
          placeholderTextColor='#999'
        />
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        {/*Show history/recent*/}
        {!searchQuery && loadingData ? (
          <View
            style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
          >
            <ActivityIndicator size='small' color='#666' />
            <Text style={{ marginTop: 8, color: '#666' }}>Loading...</Text>
          </View>
        ) : (
          <>
            {!searchQuery && searchHistory}
            {!searchQuery && groupsHistory}
          </>
        )}

        {searchQuery && searchLoading ? (
          <View
            style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
          >
            <ActivityIndicator size='small' color='#666' />
            <Text style={{ marginTop: 8, color: '#666' }}>Loading...</Text>
          </View>
        ) : (
          <>
            {searchQuery && foundPost && (
              <View>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Text style={styles.emptyHeadline}>POSTS</Text>
                  {postsToShow.length > 3 && (
                    <TouchableOpacity
                      onPress={() =>
                        router.push({
                          pathname: '/(tabs)/Gather/seeMorePosts',
                          params: { q: searchQuery },
                        })
                      }
                    >
                      <Text style={styles.emptyHeadline}>see more</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <FlatList
                  data={postsToShow.slice(0, 3)}
                  renderItem={renderPosts}
                  keyExtractor={item => item.id.toString()}
                  scrollEnabled={false}
                />
              </View>
            )}

            {searchQuery && foundGroup && (
              <View>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Text style={styles.emptyHeadline}>GROUPS</Text>
                  {(filterGroups?.length ?? 0) > 3 && (
                    <TouchableOpacity
                      onPress={() =>
                        router.push({
                          pathname: '/(tabs)/Gather/seeMoreGroups',
                          params: { q: searchQuery },
                        })
                      }
                    >
                      <Text style={styles.emptyHeadline}>see more</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <FlatList
                  data={(filterGroups ?? []).slice(0, 3)}
                  renderItem={renderGroup}
                  keyExtractor={item => item.id.toString()}
                  scrollEnabled={false}
                />
              </View>
            )}
          </>
        )}

        {searchQuery && !foundGroup && !foundPost && (
          <View style={styles.emptyContainer}>
            <Feather name='calendar' size={48} color='#ccc' />
            <Text style={styles.emptyText}>No Posts or Groups available</Text>
            <Text style={styles.emptySubtext}>
              Check back later for new entries!
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default SearchScreen;

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
  },
  placeholder: {
    width: 40,
  },
  cardItem: {
    width: '100%',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingVertical: 20,
    paddingTop: 15,
  },
  containerText: {
    fontSize: 14,
    color: '#454545ff',
    textAlign: 'left',
    lineHeight: 20,
    maxWidth: 309,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'semibold',
    color: '#464646ff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyHeadline: {
    fontSize: 12,
    fontWeight: 'semibold',
    color: '#464646ff',
    marginTop: 16,
    marginBottom: 8,
    lineHeight: 16,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginTop: 0,
    flex: 1,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8E8E8',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 10,
    height: 40,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  searchFrame: {
    marginTop: 30,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 349,
    height: 72,
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
    alignItems: 'flex-start',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
});
