import { memo } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { formatDate, formatTime } from '@/helpers/dateHelpers';
import { Event } from '@/types/events';
import { Group } from '@/types/groups';

interface GroupCardProps {
  group: Group;
  width?: number;
  onPress?: () => void;
}

const GroupCard = memo(({ group, width = 248, onPress }: GroupCardProps) => {
  /*
    const formatEventTime = (): string => {
    if (event.eventEndDatetime) {
      return `${formatDate(event.eventDatetime)} • ${formatTime(event.eventDatetime)} - ${formatTime(event.eventEndDatetime)}`;
    }
    return `${formatDate(event.eventDatetime)} • ${formatTime(event.eventDatetime)}`;
  };
*/
  return (
    <TouchableOpacity style={[styles.eventCard, { width }]} onPress={onPress}>
      <View style={styles.imageContainer}>
        {/* TODO: Not entirely sure how to handle cover photos but for now its just placeholders */}
        {group.coverPhotoUrl ? (
          <Image
            source={{ uri: group.coverPhotoUrl }}
            style={styles.eventImage}
          />
        ) : (
          <View style={styles.eventImagePlaceholder} />
        )}
      </View>
      <View style={styles.eventContent}>
        <Text style={styles.eventTitle} numberOfLines={2}>
          {group.name}
        </Text>
        <View style={styles.eventDetail}>
          {/*<Feather size={14} color='#666' />*/}
          <Text style={styles.eventDetailText} numberOfLines={2}>
            {group.description}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  eventCard: {
    //backgroundColor: '#DCDCDC',
    borderRadius: 12,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  imageContainer: {
    height: 80,
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
    //paddingTop: 13,
    //marginLeft: 8,
    //marginRight: 8,
  },
  eventImagePlaceholder: {
    height: 80,
    backgroundColor: '#A6A6A6',
    width: 80, //'100%'
    borderRadius: 40,
  },
  eventImage: {
    height: 70,
    width: 70, //'100%'
    borderRadius: 35,
    resizeMode: 'cover',
  },
  eventContent: {
    padding: 12,
    flex: 1,
    justifyContent: 'center',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000ff',
    //marginBottom: 8,
    lineHeight: 20,
  },
  eventDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  eventDetailText: {
    fontSize: 14,
    color: '#000000ff',
    flex: 1,
  },
});

export default GroupCard;
