import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  ScrollView,
} from 'react-native';
import { useMemo, useState, useEffect } from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEvents } from '@/hooks/events/useEvents';
import EventCard from './EventCard';
import Header from '@/components/Header';
import { Event } from '@/types/events';
import { Group } from '@/types/groups';
import { useGroups } from '@/hooks/groups/useGroups';
import GroupCard from './GroupCard';
import { useAllPosts } from '@/hooks/posts/useAllPosts';
import { PostData } from '@/types/feeds/post';
import { PostItem } from '@/components/home/PostItem';
import PostCard from './PostCard';
import { useQuery } from '@tanstack/react-query';
import { getAllPosts } from '@/services/posts/getAllPosts';

export const navigationOptions = {
  headerShown: false,
};

const SearchScreen = () => {
  const params = useLocalSearchParams();
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const { data: groups, isLoading, error } = useGroups();
  const [recentGroups, setRecentGroups] = useState<Group[]>([]);
  //const { data: allPosts } = useAllPosts();
  const { data: searchResults, isLoading: searchLoading } = useQuery({
      queryKey: ['searchPosts', searchQuery],
      queryFn: () => getAllPosts(undefined, 50, searchQuery),
      enabled: !!searchQuery,
    });
  //const posts = allPosts?.pages?.flatMap(page => page.posts) ?? [];
  const postsToShow = searchResults?.posts ?? []; 
  //const initialSearch = params.search as string | undefined;
  let searchHistory = null;
  let groupsHistory = null;
  console.log('BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB');
  console.log(postsToShow);
  //console.log(params);
  //Groups
  useEffect(() => {
    if (searchQuery) {
      setRecentSearches(prev => {
        const updated = [
          searchQuery,
          ...prev.filter(oldSearch => oldSearch !== searchQuery),
        ];
        return updated.slice(0, 3);
      });
    }
  }, [searchQuery]);

  const filterGroups = useMemo(() => {
    return groups?.filter(group => {
      const matchesSearch = group.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [groups, searchQuery]);
/*
  const filterPosts = useMemo(() => {
    
    return posts.filter(post =>
      (post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.description?.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [posts, searchQuery]);
*/
  let foundGroup = filterGroups && filterGroups.length > 0;
  let foundPost = searchQuery? (searchResults?.posts?.length ?? 0) > 0 : postsToShow.length > 0;

  const groupPress = (group: Group) => {
    setRecentGroups(prev => {
      const updated = [
        group,
        ...prev.filter(tempGroup => tempGroup.id !== group.id),
      ];
      return updated.slice(0, 3);
    });
    router.push({
      pathname: '/Gather/GroupDetailScreen',
      params: { group: JSON.stringify(group) },
    });
  };

  const renderPosts = ({ item }: { item: PostData }) => (
    <View style={styles.eventItem}>
      <PostCard
        post={item}
        width={354}
        //TODO: CREATION OF A POST SCREEN
        //onPress={() => groupPress(item)}
      />
    </View>
  );
  const renderGroup = ({ item }: { item: Group }) => (
    <View style={styles.eventItem}>
      <GroupCard group={item} width={354} onPress={() => groupPress(item)} />
    </View>
  );
  //EVENTS--------
  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar style='dark' />

        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading events...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <StatusBar style='dark' />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load events</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (recentSearches.length > 0) {
    searchHistory = (
      <View style={{ marginTop: 10 }}>
        <Text style={styles.emptyHeadline}> RECENT SEARCHES </Text>
        {recentSearches.map((recentSearch, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => setSearchQuery(recentSearch)}
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
              <Text style={{ color: '#333' }}>{recentSearch}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  } else {
    searchHistory = (
      <View
        style={{
          marginTop: 16,
          padding: 16,
          backgroundColor: '#f5f5f5',
          borderRadius: 5,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: '#E0E0E0',
        }}
      >
        <Text style={{ fontSize: 16, color: '#454545ff', textAlign: 'center', borderColor:'#333' }}>
          What do you want to discover today? Press 'enter' or 'go' to see
          relevant
        </Text>
      </View>
    );
  }

  if (recentGroups.length > 0) {
    groupsHistory = (
      <View>
        <Text style={styles.emptyHeadline}>RECENTLY ACCESSED GROUPS</Text>
        {recentGroups.map((group, index) => (
          <View style={styles.eventItem} key={group.id}>
            <GroupCard
              group={group}
              width={354}
              onPress={() => groupPress(group)}
            />
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={[styles.searchContainer, {backgroundColor: '#ffffffff', paddingTop: 0}]}>
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
          size={24}
          color='#666'
          style={styles.searchIcon}
        />
        <TextInput
          value={searchInput}
          onChangeText={text => {
            setSearchInput(text);
          }}
          style={styles.searchInput}
          placeholder='Search for events near you'
          onSubmitEditing={() => setSearchQuery(searchInput)}
          placeholderTextColor='#999'
        />
      </View>

      {!searchQuery && searchHistory}
      {!searchQuery && groupsHistory}

      {searchQuery && foundPost && (
        <View>
          <Text style={styles.emptyHeadline}>POSTS</Text>
          <FlatList
            data={postsToShow}
            renderItem={renderPosts}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.eventsList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<View />}
          />
        </View>
      )}

      {searchQuery && foundGroup && (
        <View>
          <Text style={styles.emptyHeadline}>GROUPS</Text>
          <FlatList
            data={filterGroups}
            renderItem={renderGroup}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.eventsList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<View />}
          />
        </View>
      )}
      {!foundGroup && !foundPost && (
        <View style={styles.emptyContainer}>
          <Feather name='calendar' size={48} color='#ccc' />
          <Text style={styles.emptyText}>No Posts or Groups available</Text>
          <Text style={styles.emptySubtext}>
            Check back later for new entries!
          </Text>
        </View>
      )}
    </View>
  );
};

export default SearchScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    //paddingTop: 32,
    paddingBottom: 16,
    //borderBottomWidth: 0,
    //borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
  },
  placeholder: {
    width: 40,
  },
  eventsList: {
    //paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
    gap: 16,
  },
  eventItem: {
    //alignSelf: 'center',
    width: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingBottom: 200, //random testing
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#464646ff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyHeadline: {
    fontSize: 14,
    fontWeight: '600',
    color: '#464646ff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    //color: '#666',
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
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  tagsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 16,
    gap: 10,
  },
  tagButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#6C6C6C',
    backgroundColor: '#FFFFFF',
  },
  tagButtonSelected: {
    backgroundColor: '#333333',
    borderColor: '#333333',
  },
  tagText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  tagTextSelected: {
    color: '#FFFFFF',
  },
  genreTagsWrapper: {
    marginTop: 16,
    marginBottom: 0,
    backgroundColor: '#fff',
    paddingBottom: 10,
  },
  genreTagsContainer: {
    maxHeight: 60,
  },
  genreTagsContent: {
    paddingHorizontal: 20,
    alignItems: 'center',
    height: 60,
  },
  genreTagItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    height: 50,
    marginRight: 12,
  },
  genreTagItemSelected: {
    borderBottomWidth: 2,
    borderColor: '#000',
  },
  genreTagText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    textAlign: 'center',
  },
  genreTagTextSelected: {
    fontWeight: '600',
  },
});

/*
    <View style={styles.emptyContainer}>
                      <Feather name='calendar' size={48} color='#ccc' />
                      <Text style={styles.emptyText}>No Posts available</Text>
                      <Text style={styles.emptySubtext}>
                        Check back later for new posts
                      </Text>
                    </View> */
