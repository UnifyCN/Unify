import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import CreatePostIcon from '@/assets/images/create-post.svg';
import { Theme } from '@/constants/Theme';
import { Group } from '@/types/groups';

interface CreatePostButtonProps {
  preselectedGroup?: Group | null;
}

export default function CreatePostButton({
  preselectedGroup,
}: CreatePostButtonProps) {
  const router = useRouter();

  const handlePress = () => {
    if (preselectedGroup) {
      router.push({
        pathname: '/create-post' as any,
        params: { preselectedGroup: JSON.stringify(preselectedGroup) },
      });
      return;
    }
    router.push('/create-post' as any);
  };

  return (
    <TouchableOpacity style={styles.floatingButton} onPress={handlePress}>
      <CreatePostIcon width={27} height={27} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 20, // Above the bottom navigation
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Theme.primaryGatherRed,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
});
