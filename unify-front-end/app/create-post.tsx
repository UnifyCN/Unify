import React, { useMemo } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import CreatePostForm from '@/components/posts/CreatePostForm';
import { Group } from '@/types/groups';

export default function CreatePostScreen() {
  const router = useRouter();
  const { preselectedGroup } = useLocalSearchParams<{ preselectedGroup?: string }>();

  const parsedGroup = useMemo<Group | null>(() => {
    if (!preselectedGroup || typeof preselectedGroup !== 'string') {
      return null;
    }
    try {
      return JSON.parse(preselectedGroup) as Group;
    } catch (error) {
      console.warn('Failed to parse preselectedGroup param', error);
      return null;
    }
  }, [preselectedGroup]);

  return (
    <CreatePostForm
      preselectedGroup={parsedGroup}
      onCancel={() => router.back()}
      onSuccessNavigate={({ postedToGroup, group }) => {
        if (postedToGroup && group) {
          router.replace({
            pathname: '/group-detail' as any,
            params: { group: JSON.stringify(group) },
          });
        } else {
          router.replace('/(tabs)' as any);
        }
      }}
    />
  );
}
