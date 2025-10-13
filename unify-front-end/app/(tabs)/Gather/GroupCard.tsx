import { memo } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity } from 'react-native';
import { Group } from '@/types/groups';

interface GroupCardProps {
  group: Group;
  width?: number;
  onPress?: () => void;
}

const GroupCard = memo(({ group, width = 248, onPress }: GroupCardProps) => {
  return (
    <TouchableOpacity style={[styles.groupCard, { width }]} onPress={onPress}>
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
            {group.description}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  groupCard: {
    borderRadius: 12,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  imageContainer: {
    height: 80,
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupImagePlaceholder: {
    height: 80,
    backgroundColor: '#A6A6A6',
    width: 80,
    borderRadius: 40,
  },
  groupImage: {
    height: 70,
    width: 70,
    borderRadius: 35,
    resizeMode: 'cover',
  },
  groupContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
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
