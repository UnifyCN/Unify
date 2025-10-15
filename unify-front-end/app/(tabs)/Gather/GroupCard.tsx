import { memo } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity } from 'react-native';
import { Group } from '@/types/groups';

interface GroupCardProps {
  group: Group;
  onPress?: () => void;
}

const GroupCard = memo(({ group, onPress }: GroupCardProps) => {
  return (
    <TouchableOpacity style={[styles.groupCard]} onPress={onPress}>
      <View style={styles.imageContainer}>
        {group.coverPhotoUrl ? (
          <Image
            source={{ uri: group.coverPhotoUrl }}
            style={styles.groupImage}
          />
        ) : (
          <View style={styles.groupImagePlaceholder} />
        )}
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
  groupImagePlaceholder: {
    height: 48,
    backgroundColor: '#A6A6A6',
    width: 48,
    borderRadius: 24,
  },
  groupImage: {
    height: 48,
    width: 48,
    borderRadius: 24,
    resizeMode: 'cover',
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
