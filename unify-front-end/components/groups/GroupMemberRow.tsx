import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Avatar } from '@/components/Avatar';
import { FollowButton } from '@/components/profile/FollowButton';
import { router } from 'expo-router';

export default function GroupMemberRow({ member }: any) {
  return (
    <View style={styles.row}>
      <TouchableOpacity
        style={styles.left}
        onPress={() =>
          router.push({
            pathname: '/profile',
            params: { userId: member.id },
          })
        }
      >
        <Avatar
          profilePictureUrl={member.profilePictureUrl || undefined}
          username={member.username}
          size={42}
        />
        <Text style={styles.name}>{member.username}</Text>
      </TouchableOpacity>

      {!member.isFollowing && (
        <FollowButton targetUserId={member.id} compact />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  name: {
    fontSize: 16,
    fontWeight: '500',
  },
});