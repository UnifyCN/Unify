import { memo } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Group } from '@/types/groups';
import { Avatar } from '@/components/Avatar';

interface GroupCardProps {
  group: Group;
  onPress?: () => void;
}

const GroupCard = memo(({ group, onPress }: GroupCardProps) => {
  return (
    <TouchableOpacity style={[styles.groupCard]} onPress={onPress}>
      <View style={styles.imageContainer}>
        <Avatar
          profilePictureUrl={group.coverPhotoUrl || undefined}
          username={group.name}
          size={48}
        />
      </View>
      <View style={styles.groupContent}>
        <Text style={styles.groupTitle} numberOfLines={2}>
          {group.name}
        </Text>
        <View style={styles.groupDetail}>
          <Text style={styles.groupDetailText} numberOfLines={2}>
            {group.description ?? ''}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  groupCard: {
    overflow: 'hidden',
    flexDirection: 'row',
    width: '100%',
    minHeight: 58,
    alignItems: 'flex-start',
    marginTop: 5,
    paddingVertical: 6,
  },
  imageContainer: {
    height: 58,
    width: 58,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupContent: {
    paddingHorizontal: 12,
    flex: 1,
    justifyContent: 'flex-start',
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000ff',
    lineHeight: 20,
  },
  groupDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  groupDetailText: {
    fontSize: 14,
    color: '#000000ff',
    flex: 1,
  },
});

export default GroupCard;
