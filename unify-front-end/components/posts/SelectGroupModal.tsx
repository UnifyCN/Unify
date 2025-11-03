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
import BackHeader from '@/components/BackHeader';

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
      animationType='slide'
      statusBarTranslucent
      onRequestClose={handleCancel}
    >
      <BackHeader title='Select Group' backIcon='x' onBack={handleCancel} />
      <View style={styles.container}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <Feather name='search' size={18} color={Theme.textInput} />
            <TextInput
              style={styles.searchInput}
              placeholder='Select a group'
              placeholderTextColor={Theme.textAlternateGray}
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
              <ActivityIndicator size='large' color={Theme.primaryGatherRed} />
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
  },
  searchContainer: {
    marginVertical: 16,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Theme.surfaceTextInput,
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 7,
    gap: 15,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
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
