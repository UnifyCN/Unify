import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { getAllPosts } from '@/services/posts/getAllPosts';
import PostCard from './PostCard';
import { PostData } from '@/types/feeds/post';
import { Feather } from '@expo/vector-icons';

export default function MorePostsScreen() {
  const { q } = useLocalSearchParams(); // q is optional search query
  const searchQuery = (q as string) ?? '';

  const { data: searchResults } = useQuery({
    queryKey: ['morePosts', searchQuery],
    queryFn: () => getAllPosts(undefined, 200, searchQuery),
    enabled: true,
  });

  const posts: PostData[] = searchResults?.posts ?? [];

const renderPosts = ({ item }: { item: PostData }) => {
  return (
    <View style={styles.cardWrapper}>
        <View style = {styles.post}>
            <PostCard post={item} width={353} />
        </View>
    </View>
  );
};

  return (
    <View style={[styles.searchContainer, { backgroundColor: '#ffffffff', paddingTop: 0 },]}>
      
      <View style={[styles.header, { paddingTop: 0 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name='chevron-left' size={24} color='#000' />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Search</Text>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        data={posts}
        renderItem={renderPosts}
        keyExtractor={(i: PostData) => String(i.id)}
        style={{ marginHorizontal: -20 }}
        contentContainerStyle={[ styles.feedContainer, { paddingTop: 12, paddingHorizontal: 0, alignItems: 'stretch'}]}
        ItemSeparatorComponent={() => (
            <View style={styles.divider} />
        )}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

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
  cardList: {
    paddingTop: 8,
    paddingBottom: 20,
    gap: 16,
  },
  cardItem: {
    width: '100%',
  },
  cardWrapper: {
    alignItems: 'center',
    paddingHorizontal: 20, 
    paddingVertical: 16, 
    width: '100%',  
  },
  feedContainer: {
    paddingBottom: 44,
    marginBottom: 36,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginHorizontal: 0,
    width: '100%',
    alignSelf: 'stretch'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingVertical: 20,
    paddingTop: 15, //TEST
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
    fontWeight: '400',
    color: '#464646ff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyHeadline: {
    fontSize: 12,
    fontWeight: '500',
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
    searchFrame: {
      marginTop: 15,            
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
    post: {
        width: 353,
        paddingHorizontal: 16,
        paddingVertical: 8,
    }
  });