import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { getUserJoinedGroups } from '@/services/groups/getUserJoinedGroups';
import { useQuery } from '@tanstack/react-query';
import Feather from '@expo/vector-icons/Feather';
import { Theme } from '@/constants/Theme';
import SearchGroupsList from '@/components/groups/SearchGroupsList';

interface SelectGroupModalProps {
  visible: boolean;
  onClose: () => void;
  onGroupSelect: (group: any) => void;
}

export default function SelectGroupModal({
  visible,
  onClose,
  onGroupSelect,
}: SelectGroupModalProps) {
  const [searchText, setSearchText] = useState('');

  // Fetch user's joined groups
  const { data: groups, isLoading: groupsLoading } = useQuery({
    queryKey: ['joined-groups'],
    queryFn: getUserJoinedGroups,
    enabled: visible, // Only fetch when modal is visible
  });

  // Filter groups based on search text
  const filteredGroups = useMemo(() => {
    if (!groups || !searchText.trim()) {
      return groups || [];
    }

    return groups.filter(group =>
      group.name.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [groups, searchText]);

  const handleGroupSelect = (group: any) => {
    onGroupSelect(group);
    setSearchText(''); // Clear search when closing
  };

  const handleCancel = () => {
    setSearchText(''); // Clear search when closing
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType='none'
      statusBarTranslucent
      onRequestClose={handleCancel}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel}>
            <Feather name='x' size={24} color='black' />
          </TouchableOpacity>
          <Text style={styles.title}>Post to</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <Feather name='search' size={20} color={Theme.textInput} />
            <TextInput
              style={styles.searchInput}
              placeholder='Search for a group'
              placeholderTextColor={Theme.textInput}
              value={searchText}
              onChangeText={setSearchText}
              autoCapitalize='none'
              autoCorrect={false}
            />
          </View>
        </View>

        <ScrollView style={styles.content}>
          {groupsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size='large' color='#007AFF' />
              <Text style={styles.loadingText}>Loading groups...</Text>
            </View>
          ) : (
            <SearchGroupsList
              groups={filteredGroups}
              onGroupSelect={handleGroupSelect}
              searchText={searchText}
            />
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
  },
  searchContainer: {
    paddingVertical: 10,
  },
  searchInputWrapper: {
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
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});
