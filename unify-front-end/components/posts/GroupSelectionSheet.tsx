import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { getUserJoinedGroups } from '@/services/groups/getUserJoinedGroups';
import { getAvailableGroups } from '@/services/groups/getAvailableGroups';
import { joinGroup } from '@/services/groups/joinGroup';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Feather from '@expo/vector-icons/Feather';
import { Theme } from '@/constants/Theme';
import { Avatar } from '@/components/Avatar';
import BottomSheet from '@/components/common/BottomSheet';
import { Group } from '@/types/groups';
import { useGroups } from '@/hooks/groups/useGroups';

interface GroupSelectionSheetProps {
  visible: boolean;
  onClose: () => void;
  onGroupSelect: (group: Group) => void;
  useModal?: boolean;
}

export default function GroupSelectionSheet({
  visible,
  onClose,
  onGroupSelect,
  useModal = true,
}: GroupSelectionSheetProps) {
  const [searchText, setSearchText] = useState('');
  const [joiningGroupId, setJoiningGroupId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  // Fetch user's joined groups
  const { data: joinedGroups, isLoading: joinedLoading } = useQuery({
    queryKey: ['joined-groups', 'self'],
    queryFn: () => getUserJoinedGroups(),
    enabled: visible,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch available groups (groups user hasn't joined)
  const { data: availableGroups, isLoading: availableLoading } = useGroups();

  // Join group mutation
  const joinMutation = useMutation({
    mutationFn: (groupId: number) => joinGroup(groupId),
    onSuccess: () => {
      // Invalidate queries to refresh the lists
      queryClient.invalidateQueries({ queryKey: ['joined-groups', 'self'] });
      queryClient.invalidateQueries({ queryKey: ['personalize', 'groups'] });
      queryClient.invalidateQueries({ queryKey: ['available-groups'] });
    },
  });

  const hasJoinedGroups = joinedGroups && joinedGroups.length > 0;

  // Filter joined groups based on search
  const filteredJoinedGroups = useMemo(() => {
    if (!joinedGroups || !searchText.trim()) {
      return joinedGroups || [];
    }
    return joinedGroups.filter(group =>
      group.name.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [joinedGroups, searchText]);

  // Filter available groups based on search
  const filteredAvailableGroups = useMemo(() => {
    if (!availableGroups || !searchText.trim()) {
      return availableGroups || [];
    }
    return availableGroups.filter(group =>
      group.name.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [availableGroups, searchText]);

  const handleGroupSelect = (group: Group) => {
    onGroupSelect(group);
    setSearchText('');
    onClose();
  };

  const handleJoinAndSelect = async (group: Group) => {
    setJoiningGroupId(group.id);
    try {
      await joinMutation.mutateAsync(group.id);
      // After joining, select the group for posting
      handleGroupSelect(group);
    } catch (error) {
      Alert.alert(
        'Failed to Join',
        error instanceof Error
          ? error.message
          : 'Could not join group. Please try again.'
      );
    } finally {
      setJoiningGroupId(null);
    }
  };

  const handleClose = () => {
    setSearchText('');
    onClose();
  };

  const isLoading = joinedLoading || availableLoading;

  const renderGroupItem = (group: Group, isJoined: boolean) => (
    <TouchableOpacity
      key={group.id}
      style={styles.groupOption}
      onPress={() => handleGroupSelect(group)}
      activeOpacity={0.7}
      disabled={!isJoined}
    >
      <Avatar
        profilePictureUrl={group.coverPhotoUrl || undefined}
        username={group.name}
        size={56}
      />
      <View style={styles.groupInfo}>
        <Text style={styles.groupName}>{group.name}</Text>
        <Text style={styles.groupDescription} numberOfLines={2}>
          {group.description || 'No description available'}
        </Text>
      </View>
      {!isJoined && (
        <TouchableOpacity
          style={styles.joinButton}
          onPress={() => handleJoinAndSelect(group)}
          disabled={joiningGroupId === group.id}
        >
          {joiningGroupId === group.id ? (
            <ActivityIndicator size='small' color='#fff' />
          ) : (
            <Text style={styles.joinButtonText}>Join & Post</Text>
          )}
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  return (
    <BottomSheet visible={visible} onClose={handleClose} useModal={useModal}>
      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <Feather name='search' size={20} color={Theme.textInput} />
            <TextInput
              style={styles.searchInput}
              placeholder='Search groups'
              placeholderTextColor={Theme.textAlternateGray}
              value={searchText}
              onChangeText={setSearchText}
              autoCapitalize='none'
              autoCorrect={false}
            />
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size='large' color={Theme.primaryGatherRed} />
              <Text style={styles.loadingText}>Loading groups...</Text>
            </View>
          ) : (
            <>
              {/* Your Groups Section */}
              {hasJoinedGroups && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Your Groups</Text>
                  <View style={styles.groupsList}>
                    {filteredJoinedGroups.length > 0 ? (
                      filteredJoinedGroups.map(group =>
                        renderGroupItem(group, true)
                      )
                    ) : (
                      <Text style={styles.noResultsText}>
                        No groups match your search
                      </Text>
                    )}
                  </View>
                </View>
              )}

              {/* Discover Groups Section */}
              {filteredAvailableGroups &&
                filteredAvailableGroups.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                      {hasJoinedGroups
                        ? 'Discover More Groups'
                        : 'Discover Groups'}
                    </Text>
                    <Text style={styles.sectionSubtitle}>
                      Join a group to post there
                    </Text>
                    <View style={styles.groupsList}>
                      {filteredAvailableGroups.map(group =>
                        renderGroupItem(group, false)
                      )}
                    </View>
                  </View>
                )}

              {/* Empty state when no groups at all */}
              {!hasJoinedGroups &&
                (!filteredAvailableGroups ||
                  filteredAvailableGroups.length === 0) && (
                  <View style={styles.emptyContainer}>
                    {searchText.trim() ? (
                      <>
                        <Text style={styles.emptyTitle}>
                          No groups match your search
                        </Text>
                        <Text style={styles.emptySubtitle}>
                          Try a different search term
                        </Text>
                      </>
                    ) : (
                      <>
                        <Text style={styles.emptyTitle}>
                          No groups available
                        </Text>
                        <Text style={styles.emptySubtitle}>
                          Check back later for new groups to join!
                        </Text>
                      </>
                    )}
                  </View>
                )}
            </>
          )}
        </ScrollView>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 8,
    paddingBottom: 20,
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Theme.surfaceTextInput,
    borderRadius: 100,
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 15,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Theme.black,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Theme.black,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Theme.textAlternateGray,
    marginBottom: 12,
  },
  groupsList: {
    gap: 16,
  },
  groupOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    gap: 12,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.black,
    marginBottom: 2,
  },
  groupDescription: {
    fontSize: 14,
    color: '#666',
  },
  joinButton: {
    backgroundColor: Theme.primaryGatherRed,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    minWidth: 90,
    alignItems: 'center',
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  noResultsText: {
    fontSize: 14,
    color: Theme.textAlternateGray,
    textAlign: 'center',
    paddingVertical: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Theme.black,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Theme.textAlternateGray,
    textAlign: 'center',
  },
});
