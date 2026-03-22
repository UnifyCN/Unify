import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Avatar } from '@/components/Avatar';
import { Theme } from '@/constants/Theme';
import type { GroupMember } from '@/services/groups/getGroupMembers';

export default function GroupMemberAvatarStack({
  members,
  totalCount,
  onPress,
}: {
  members: GroupMember[];
  totalCount: number;
  onPress: () => void;
}) {
  const MAX_VISIBLE = 4;

  // Show mutuals first in the avatar stack
  const mutuals = members.filter(m => m.isMutual);
  const nonMutuals = members.filter(m => !m.isMutual);
  const sorted = [...mutuals, ...nonMutuals];
  const visible = sorted.slice(0, MAX_VISIBLE);

  const remaining = totalCount - visible.length;

  // Build contextual label
  const label = buildLabel(mutuals, totalCount);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.row}>
        {visible.map((m, i) => (
          <View
            key={m.id}
            style={[
              styles.avatarWrapper,
              { marginLeft: i === 0 ? 0 : -10, zIndex: 10 - i },
            ]}
          >
            <Avatar
              profilePictureUrl={m.profilePictureUrl || undefined}
              username={m.username}
              size={32}
            />
          </View>
        ))}
      </View>

      <Text style={styles.text} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function buildLabel(mutuals: GroupMember[], totalCount: number): string {
  if (mutuals.length === 0) {
    return `+${totalCount} members`;
  }

  const firstName = mutuals[0].username;

  if (mutuals.length === 1 && totalCount <= 1) {
    return firstName;
  }

  const othersCount = totalCount - 1;
  if (mutuals.length === 1) {
    return `${firstName} and ${othersCount} other${othersCount === 1 ? '' : 's'}`;
  }

  // 2+ mutuals
  return `${firstName}, ${mutuals[1].username} and ${totalCount - 2} other${totalCount - 2 === 1 ? '' : 's'}`;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    marginRight: 10,
  },
  avatarWrapper: {
    borderWidth: 2,
    borderColor: Theme.white,
    borderRadius: 999,
  },
  text: {
    fontSize: 14,
    color: Theme.textAlternateGray,
    flexShrink: 1,
  },
});
