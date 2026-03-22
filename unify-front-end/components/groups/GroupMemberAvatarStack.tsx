import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Avatar } from '@/components/Avatar';
import { Theme } from '@/constants/Theme';

export default function GroupMemberAvatarStack({
  members,
  totalCount,
  onPress,
}: any) {
  const MAX_VISIBLE = 4;
  const visible = members.slice(0, MAX_VISIBLE);

  const remaining = totalCount - visible.length;

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.row}>
        {visible.map((m: any, i: number) => (
          <View
            key={m.id}
            style={{
              marginLeft: i === 0 ? 0 : -10,
              zIndex: 10 - i,
            }}
          >
            <Avatar
              profilePictureUrl={m.profilePictureUrl || undefined}
              username={m.username}
              size={32}
            />
          </View>
        ))}
      </View>

      {remaining > 0 && (  
      <Text style={styles.text}>
        +{Math.max(0, totalCount - visible.length)} members
      </Text>
      )}
    </TouchableOpacity>
  );
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
  text: {
    fontSize: 14,
    color: Theme.textAlternateGray,
  },
});