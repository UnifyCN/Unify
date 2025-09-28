import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useState, useMemo, memo, useEffect } from 'react';
import { useUserPosts } from '@/hooks/posts/useUserPosts';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import SavedFeed from '@/components/profile/SavedFeed';
import UserPostsFeed from '@/components/profile/UserPostsFeed';
import EmptyFeedMessage from '@/components/profile/EmptyFeedMessage';
import { supabase } from '@/lib/supabase';

interface TabHeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isCurrentUser: boolean;
}

const TabHeader = memo(
  ({ activeTab, setActiveTab, isCurrentUser }: TabHeaderProps) => {
    const tabs = isCurrentUser
      ? ['Posts', 'Comments', 'Saved']
      : ['Posts', 'Comments'];

    return (
      <View style={styles.tabs}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.activeTabText,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }
);

export default function Profile() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const isCurrentUser = currentUserId === userId;

  useEffect(() => {
    const getCurrentUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    getCurrentUser();
  }, []);

  const [activeTab, setActiveTab] = useState('Posts');

  useEffect(() => {
    if (!isCurrentUser && activeTab === 'Saved') {
      setActiveTab('Posts');
    }
  }, [isCurrentUser, activeTab]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isRefetching,
    refetch,
  } = useUserPosts(userId);

  const HeaderComponent = useMemo(
    () => (
      <View>
        <ProfileHeader userId={userId} isCurrentUser={isCurrentUser} />
        <TabHeader
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isCurrentUser={isCurrentUser}
        />
      </View>
    ),
    [userId, activeTab, setActiveTab, isCurrentUser]
  );

  const renderTabContent = useMemo(() => {
    switch (activeTab) {
      case 'Comments':
        return null;
      case 'Saved':
        if (!isCurrentUser) return null;
        return (
          <SavedFeed
            ListHeaderComponent={HeaderComponent}
            ListEmptyComponent={
              <EmptyFeedMessage
                message='No saved posts'
                submessage='Save posts to see them here'
              />
            }
          />
        );
      default:
        return (
          <UserPostsFeed
            userId={userId}
            ListHeaderComponent={HeaderComponent}
            ListEmptyComponent={
              <EmptyFeedMessage
                message='No posts to see'
                submessage={
                  isCurrentUser
                    ? "You haven't posted anything yet"
                    : "This user hasn't posted anything yet"
                }
              />
            }
          />
        );
    }
  }, [
    activeTab,
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isRefetching,
    refetch,
    HeaderComponent,
    isCurrentUser,
  ]);

  return (
    <View style={styles.container}>
      <View style={styles.feedContainer}>{renderTabContent}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  feedContainer: {
    flex: 1,
  },
  tabs: {
    marginTop: 16,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  tab: {
    backgroundColor: 'transparent',
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    marginHorizontal: 20,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#000',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#000',
  },
});
