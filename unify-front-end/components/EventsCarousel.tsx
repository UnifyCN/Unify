import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEvents } from '@/hooks/events/useEvents';
import EventCard from '@/app/(tabs)/Gather/EventCard';
import ViewMoreCard from '@/app/(tabs)/Gather/ViewMoreCard';

interface EventsCarouselProps {
  title?: string;
  titleStyle?: any;
  showViewMore?: boolean;
  maxEvents?: number;
  style?: any;
  contentContainerStyle?: any;
}

export const EventsCarousel = ({
  title = 'Gather Events',
  titleStyle,
  showViewMore = true,
  maxEvents = 3,
  style,
  contentContainerStyle,
}: EventsCarouselProps) => {
  const router = useRouter();
  const { data: events, isLoading } = useEvents();

  const now = new Date();
  const upcomingEvents = events?.filter(event => {
    const eventDate = new Date(event.eventDatetime);
    return eventDate > now;
  }) || [];

  const displayEvents = upcomingEvents.slice(0, maxEvents);

  const handleEventPress = (event: any) => {
    router.push({
      pathname: '/(tabs)/Gather/EventDetailScreen',
      params: { event: JSON.stringify(event) },
    });
  };

  const handleViewMore = () => {
    router.push('/(tabs)/Gather/EventsScreen');
  };

  return (
    <View style={style}>
      <View style={styles.header}>
        <Text style={[styles.headerText, titleStyle]}>{title}</Text>
        {showViewMore && (
          <TouchableOpacity onPress={handleViewMore}>
            <Feather name='chevron-right' size={24} color='#000' />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.eventsCarousel}
        contentContainerStyle={[
          styles.eventsCarouselContent,
          upcomingEvents.length === 0 && styles.eventsCarouselContentEmpty,
          contentContainerStyle,
        ]}
      >
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size='large' color='#000' />
          </View>
        )}
        {!isLoading && upcomingEvents.length === 0 && (
          <View style={styles.emptyEventsContainer}>
            <Text style={styles.emptyEventsText}>No upcoming events</Text>
            <Text style={styles.emptyEventsSubtext}>
              Check back later for new events
            </Text>
          </View>
        )}
        {displayEvents.map(event => (
          <EventCard
            key={event.id}
            event={event}
            onPress={() => handleEventPress(event)}
          />
        ))}
        {upcomingEvents.length > maxEvents && (
          <ViewMoreCard onPress={handleViewMore} />
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  eventsCarousel: {
    marginBottom: 20,
  },
  eventsCarouselContent: {
    paddingHorizontal: 0,
  },
  eventsCarouselContentEmpty: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyEventsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyEventsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  emptyEventsSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
