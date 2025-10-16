import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Group } from '@/types/groups';
import { Avatar } from '@/components/Avatar';

interface GroupsListProps {
  groups: Group[];
  onGroupSelect: (group: Group) => void;
  searchText?: string;
}

export default function SearchGroupsList({
  groups,
  onGroupSelect,
  searchText,
}: GroupsListProps) {
  return (
    <View style={styles.groupsList}>
      {groups.length > 0 ? (
        groups.map(group => (
          <TouchableOpacity
            key={group.id}
            style={styles.groupOption}
            onPress={() => onGroupSelect(group)}
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
          </TouchableOpacity>
        ))
      ) : (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateText}>
            {searchText?.trim()
              ? 'No groups found matching your search'
              : 'No groups joined yet'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  groupsList: {
    paddingTop: 12,
    gap: 30,
  },
  groupOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 12,
    gap: 16,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  groupDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  emptyStateContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
