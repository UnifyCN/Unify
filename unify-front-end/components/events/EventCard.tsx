import { memo } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { formatTime } from '@/helpers/dateHelpers';
import { Event } from '@/types/events';
import { Theme } from '@/constants/Theme';
import {
  EVENT_CARD_WIDTH,
  getEventCardHeight,
  getEventCardImageHeight,
} from '@/constants/EventCard';

interface EventCardProps {
  event: Event;
  width?: number;
  height?: number;
  onPress?: () => void;
}

const EventCard = memo(
  ({ event, width = EVENT_CARD_WIDTH, height, onPress }: EventCardProps) => {
    const cardHeight = height ?? getEventCardHeight(width);
    const imageHeight = getEventCardImageHeight(width);

    const eventDate = new Date(event.eventDatetime);
    const dateDay = eventDate.toLocaleDateString('en-US', {
      day: 'numeric',
    });
    const dateMonth = eventDate.toLocaleDateString('en-US', {
      month: 'short',
    });

    const formatCardTime = (dateString: string): string =>
      formatTime(dateString).toLowerCase();

    const formatEventTime = (): string => {
      if (event.eventEndDatetime) {
        return `${formatCardTime(event.eventDatetime)} - ${formatCardTime(event.eventEndDatetime)}`;
      }
      return formatCardTime(event.eventDatetime);
    };

    return (
      <TouchableOpacity
        style={[styles.eventCard, { width, height: cardHeight }]}
        onPress={onPress}
      >
        <View style={[styles.imageContainer, { height: imageHeight }]}>
          {event.coverPhotoUrl ? (
            <Image source={{ uri: event.coverPhotoUrl }} style={styles.eventImage} />
          ) : (
            <View style={styles.eventImagePlaceholder} />
          )}
          <View style={styles.datePill}>
            <Text style={styles.datePillDay}>{dateDay}</Text>
            <Text style={styles.datePillMonth}>{dateMonth}</Text>
          </View>
        </View>
        <View style={styles.eventContent}>
          <Text style={styles.eventTitle} numberOfLines={1}>
            {event.title}
          </Text>
          <View style={styles.eventDetailRow}>
            <Feather name='calendar' size={18} color='#9B9797' />
            <Text style={styles.eventDetailText}>{formatEventTime()}</Text>
          </View>
          <View style={styles.eventDetailRow}>
            <Feather name='map-pin' size={18} color='#9B9797' />
            <Text style={styles.eventDetailText} numberOfLines={1}>
              {event.location}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }
);

const styles = StyleSheet.create({
  eventCard: {
    backgroundColor: Theme.white,
    borderColor: Theme.borderCard,
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
    marginHorizontal: 2,
    marginBottom: 6,
  },
  imageContainer: {
    width: '100%',
    borderRadius: 0,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: Theme.imagePlaceholder,
  },
  eventImagePlaceholder: {
    height: '100%',
    width: '100%',
    backgroundColor: Theme.imagePlaceholder,
  },
  eventImage: {
    height: '100%',
    width: '100%',
    resizeMode: 'cover',
  },
  datePill: {
    position: 'absolute',
    top: 10,
    left: 12,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.82)',
    borderColor: 'rgba(255, 255, 255, 0.55)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  datePillDay: {
    fontSize: 15,
    lineHeight: 15,
    fontWeight: '500',
    color: Theme.secondaryBlack,
  },
  datePillMonth: {
    fontSize: 15,
    lineHeight: 15,
    fontWeight: '500',
    color: Theme.secondaryBlack,
  },
  eventContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Theme.black,
    marginBottom: 6,
    lineHeight: 24,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  eventDetailText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9B9797',
    flex: 1,
    lineHeight: 20,
  },
});

export default EventCard;
