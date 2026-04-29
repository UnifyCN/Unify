import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Avatar } from '@/components/Avatar';
import { FollowButton } from '@/components/profile/FollowButton';
import { router } from 'expo-router';
import { Theme } from '@/constants/Theme';
import type { GroupMember } from '@/services/groups/getGroupMembers';

export default function GroupMemberRow({
  member,
  highlight = false,
}: {
  member: GroupMember;
  highlight?: boolean;
}) {
  const relationshipLabel =
    member.isFollowing && member.followsYou
      ? 'Mutuals'
      : member.followsYou
        ? 'Follows you'
        : null;

  return (
    <View style={[styles.row, highlight && styles.highlightRow]}>
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
        <View style={styles.nameBlock}>
          <Text style={styles.name}>{member.username}</Text>
          {highlight && relationshipLabel && (
            <Text style={styles.relationship}>{relationshipLabel}</Text>
          )}
        </View>
      </TouchableOpacity>

      {!member.isFollowing && (
        <FollowButton targetUserId={member.id} compact source='community' />
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
    paddingHorizontal: 4,
    borderRadius: 10,
  },
  highlightRow: {
    backgroundColor: '#FFF8F0',
    marginHorizontal: -4,
    paddingHorizontal: 8,
    marginVertical: 2,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  nameBlock: {
    flexShrink: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '500',
    color: Theme.black,
  },
  relationship: {
    fontSize: 12,
    color: Theme.primaryGatherRed,
    fontWeight: '500',
    marginTop: 1,
  },
});
