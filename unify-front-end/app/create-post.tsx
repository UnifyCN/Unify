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
      const parsed = JSON.parse(preselectedGroup) as Partial<Group>;
      const hasValidId =
        typeof parsed.id === 'number' && Number.isFinite(parsed.id);
      const hasValidName =
        typeof parsed.name === 'string' && parsed.name.trim().length > 0;

      if (!hasValidId || !hasValidName) {
        console.warn(
          'Invalid preselectedGroup payload for parsedGroup',
          preselectedGroup
        );
        return null;
      }

      return parsed as Group;
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
