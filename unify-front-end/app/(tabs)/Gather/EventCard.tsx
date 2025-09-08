import { memo } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { formatDate, formatTime } from '@/helpers/dateHelpers';
import { Event } from '@/types/events';

interface EventCardProps {
  event: Event;
  width?: number;
  onPress?: () => void;
}

const EventCard = memo(({ event, width = 248, onPress }: EventCardProps) => {
  const formatEventTime = (): string => {
    if (event.event_end_datetime) {
      return `${formatDate(event.event_datetime)} • ${formatTime(event.event_datetime)} - ${formatTime(event.event_end_datetime)}`;
    }
    return `${formatDate(event.event_datetime)} • ${formatTime(event.event_datetime)}`;
  };

  return (
    <TouchableOpacity style={[styles.eventCard, { width }]} onPress={onPress}>
      <View style={styles.eventImagePlaceholder}>
        {/* TODO: Not entirely sure how to handle cover photos but for now its just placeholders */}
        {event.cover_photo_url ? (
          <Image
            source={{ uri: event.cover_photo_url }}
            style={styles.eventImage}
          />
        ) : (
          <View style={styles.eventImagePlaceholder} />
        )}
      </View>
      <View style={styles.eventContent}>
        <Text style={styles.eventTitle} numberOfLines={2}>
          {event.title}
        </Text>
        <View style={styles.eventDetail}>
          <Feather name='calendar' size={14} color='#666' />
          <Text style={styles.eventDetailText}>{formatEventTime()}</Text>
        </View>
        <View style={styles.eventDetail}>
          <Feather name='map-pin' size={14} color='#666' />
          <Text style={styles.eventDetailText} numberOfLines={1}>
            {event.location}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  eventCard: {
    backgroundColor: '#DCDCDC',
    borderRadius: 12,
    overflow: 'hidden',
  },
  eventImagePlaceholder: {
    height: 100,
    backgroundColor: '#A6A6A6',
    width: '100%',
  },
  eventImage: {
    height: 100,
    width: '100%',
    resizeMode: 'cover',
  },
  eventContent: {
    padding: 12,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
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
    color: '#6C6C6C',
    flex: 1,
  },
});

export default EventCard;
