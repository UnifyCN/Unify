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
import { useState, useEffect } from 'react';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Group } from '@/types/groups';
import { useSearchGroups } from '@/hooks/groups/useSearchGroups';
import GroupCard from './GroupCard';
import { PostData } from '@/types/feeds/post';
import { PostItem } from '@/components/home/PostItem';
import { useQuery } from '@tanstack/react-query';
import { getAllPosts } from '@/services/posts/getAllPosts';
import { usePostMetadata } from '@/hooks/usePostMetadata';
import {
  saveRecentSearch,
  getRecentSearches,
} from '@/services/users/recentSearches';
import {
  saveRecentGroups,
  getRecentGroupsWithData,
} from '@/services/users/recentGroups';
import { supabase } from '@/lib/supabase';
import { SearchHeader } from '@/components/SearchHeader';
import { Theme } from '@/constants/Theme';

export const navigationOptions = {
  headerShown: false,
};

const SearchScreen = () => {
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const { data: searchGroups, isLoading: searchGroupsLoading } =
    useSearchGroups(searchQuery);
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

  // Batch call to get metadata of posts
  const postIds = postsToShow.map(p => p.id);
  const { data: postMetadata, isLoading: postMetadataLoading } = usePostMetadata(postIds);


  useEffect(() => {
    const loadRecent = async () => {
      setLoadingData(true);
      try {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id;
        if (!userId) return;

        const { searches } = await getRecentSearches(userId);
        setRecentSearches(searches);

        const { groups: recentGroupsData } =
          await getRecentGroupsWithData(userId);
        setRecentGroups(recentGroupsData);
      } catch (err) {
        console.error('loading error', err);
      } finally {
        setLoadingData(false);
      }
    };
    loadRecent();
  }, []);

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

  const filterGroups = searchGroups || [];

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

    // Navigate to GroupDetailScreen
    router.push({
      pathname: '/(tabs)/Gather/GroupDetailScreen' as any,
      params: { group: JSON.stringify(group) },
    });
  };

  const renderPosts = ({ item }: { item: PostData }) => {
    const metadata = postMetadata?.[item.id];
    return (
      <View style={styles.cardItem}>
        <PostItem
          post={item}
          shouldHideContent
          metadata={metadata}
          metadataLoading={postMetadataLoading}
        />
      </View>
    );
  };

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
        <Text style={styles.recentSectionHeader}>RECENT SEARCHES</Text>
        {recentSearches.map((recentSearch, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => {
              setSearchInput(recentSearch);
              handleSend(recentSearch);
            }}
            style={{ marginBottom: 12 }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Feather
                name='search'
                size={16}
                color='#666'
                style={{ marginRight: 8 }}
              />
              <Text style={{ color: Theme.black, fontSize: 14 }}>
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
        <Text style={styles.recentSectionHeader}>RECENTLY VIEWED GROUPS</Text>
        {recentGroups.map(group => (
          <View style={[styles.cardItem, { marginBottom: 20 }]} key={group.id}>
            <GroupCard group={group} onPress={() => groupPress(group)} />
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.searchContainer}>
      <SearchHeader />

      <View style={styles.searchInputContainer}>
        <Feather name='search' size={20} color={Theme.textInput} />
        <TextInput
          value={searchInput}
          onChangeText={text => {
            setSearchInput(text);
          }}
          style={styles.searchInput}
          //in figma says events and groups but this screen doesnt check events
          placeholder='Search for posts and groups'
          onSubmitEditing={() => handleSend()}
          placeholderTextColor={Theme.textInput}
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

        {searchQuery && (searchLoading || searchGroupsLoading) ? (
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
                <View style={styles.postsHeader}>
                  <Text style={[styles.resultHeaderText, { marginTop: 8 }]}>
                    POSTS
                  </Text>
                  {postsToShow.length > 3 && (
                    <TouchableOpacity
                      onPress={() =>
                        router.push({
                          pathname: '/(tabs)/Gather/seeMorePosts',
                          params: { q: searchQuery },
                        })
                      }
                    >
                      <Text style={styles.seeMoreText}>see more</Text>
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
                <View style={[styles.postsHeader, { marginBottom: 20 }]}>
                  <Text style={styles.resultHeaderText}>GROUPS</Text>
                  {(filterGroups?.length ?? 0) > 3 && (
                    <TouchableOpacity
                      onPress={() =>
                        router.push({
                          pathname: '/(tabs)/Gather/seeMoreGroups',
                          params: { q: searchQuery },
                        })
                      }
                    >
                      <Text style={styles.seeMoreText}>see more</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <FlatList
                  data={(filterGroups ?? []).slice(0, 3)}
                  renderItem={renderGroup}
                  keyExtractor={item => item.id.toString()}
                  scrollEnabled={false}
                  contentContainerStyle={{ gap: 20, paddingBottom: 20 }}
                />
              </View>
            )}
          </>
        )}

        {searchQuery &&
          !foundGroup &&
          !foundPost &&
          !searchGroupsLoading &&
          !searchLoading && (
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
    color: Theme.textInput,
    textAlign: 'left',
    lineHeight: 18,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#464646ff',
    marginTop: 16,
    marginBottom: 8,
  },
  recentSectionHeader: {
    fontSize: 12,
    color: Theme.textAlternateGray,
    fontWeight: '600',
    marginTop: 16,
    lineHeight: 14,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  postsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: Theme.textAlternateGray,
    marginTop: 16,
    marginBottom: 0,
    lineHeight: 16,
  },
  resultHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.textAlternateGray,
    marginBottom: 0,
    lineHeight: 16,
  },
  seeMoreText: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.textAlternateGray,
    marginBottom: 0,
    lineHeight: 16,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    flex: 1,
    backgroundColor: '#ffffffff',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.surfaceTextInput,
    borderRadius: 100,
    paddingHorizontal: 24,
    paddingVertical: 8,
    height: 36,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Theme.textAlternateGray,
  },
  searchFrame: {
    marginTop: 30,
    alignSelf: 'center',
    width: '100%',
    height: 69,
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: Theme.surfaceGray,
    borderRadius: 5,
    alignItems: 'flex-start',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Theme.borderInfoText,
  },
});
