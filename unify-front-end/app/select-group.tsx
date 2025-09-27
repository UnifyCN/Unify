import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { getUserJoinedGroups } from '@/services/groups/getJoinedGroups';
import { useQuery } from '@tanstack/react-query';
import Feather from '@expo/vector-icons/Feather';

export default function SelectGroupScreen() {
  // Fetch all available groups
  const { data: groups, isLoading: groupsLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: getUserJoinedGroups,
  });

  const handleGroupSelect = (group: any) => {
    // Navigate back to create-post with selected group
    router.back();
    router.setParams({ selectedGroup: JSON.stringify(group) });
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: false, // This hides the default header
        }}
      />
        <View style={styles.container}>
        <View style={styles.header}>
            <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
            <Feather name="x" size={24} color="black" />
            </TouchableOpacity>
            <Text style={styles.title}>Post to</Text>
            <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content}>
            {groupsLoading ? (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Loading groups...</Text>
            </View>
            ) : (
            <View style={styles.groupsList}>
                {groups?.map((group) => (
                <TouchableOpacity
                    key={group.id}
                    style={styles.groupOption}
                    onPress={() => handleGroupSelect(group)}
                >
                    <View style={styles.groupAvatar}>
                    {/* You can add an image here later or keep it as a placeholder */}
                    </View>
                    
                    <View style={styles.groupInfo}>
                        <Text style={styles.groupName}>{group.name}</Text>
                        <Text style={styles.groupDescription} numberOfLines={2}>
                            {group.description || 'No description available'}
                        </Text>
                    </View>
              </TouchableOpacity>
                ))}
            </View>
            )}
        </ScrollView>
        </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
  },
  placeholder: {
    width: 44, // Same width as cancel button for centering
  },
  content: {
    flex: 1,
    gap: 30,
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
  groupsList: {
    paddingHorizontal: 20,
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
  groupAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#D1D1D6', // Gray placeholder circle
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
  memberCount: {
    fontSize: 12,
    color: '#999',
  },
});