import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEvents } from '@/hooks/events/useEvents';
import EventCard from '@/app/(tabs)/Gather/EventCard';
import ViewMoreCard from '@/app/(tabs)/Gather/ViewMoreCard';
import { SkeletonLoader } from './SkeletonLoader';

// Skeleton loader component for events
const EventSkeletonCard = () => {
  return (
    <View style={skeletonStyles.eventCard}>
      <SkeletonLoader
        width='100%'
        height={80}
        borderRadius={0}
        style={skeletonStyles.eventImagePlaceholder}
      />
      <View style={skeletonStyles.eventContent}>
        <SkeletonLoader
          width='85%'
          height={20}
          borderRadius={4}
          style={skeletonStyles.titleSkeleton}
        />

        <View style={skeletonStyles.detailsContainer}>
          <View style={skeletonStyles.eventDetail}>
            <SkeletonLoader width={14} height={18} borderRadius={10} style={skeletonStyles.iconSkeleton} />
            <SkeletonLoader
              width='75%'
              height={18}
              borderRadius={4}
              style={skeletonStyles.detailSkeleton}
            />
          </View>

          <View style={skeletonStyles.eventDetail}>
            <SkeletonLoader width={14} height={18} borderRadius={10} style={skeletonStyles.iconSkeleton} />
            <SkeletonLoader
              width='50%'
              height={18}
              borderRadius={4}
              style={skeletonStyles.detailSkeleton}
            />
          </View>
        </View>
      </View>
    </View>
  );
};

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
  const upcomingEvents =
    events?.filter(event => {
      const eventDate = new Date(event.eventDatetime);
      return eventDate < now;
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
          upcomingEvents.length === 0 &&
            !isLoading &&
            styles.eventsCarouselContentEmpty,
          contentContainerStyle,
        ]}
      >
        {isLoading && (
          <View style={styles.loadingContainer}>
            {Array.from({ length: 2 }).map((_, index) => (
              <EventSkeletonCard key={`skeleton-${index}`} />
            ))}
          </View>
        )}
        {/* {!isLoading && upcomingEvents.length === 0 && (
          <View style={styles.emptyEventsContainer}>
            <Text style={styles.emptyEventsText}>No upcoming events</Text>
            <Text style={styles.emptyEventsSubtext}>
              Check back later for new events or view past events.
            </Text>
          </View>
        )} */}
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
    gap: 12,
  },
  eventsCarouselContentEmpty: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  loadingContainer: {
    flexDirection: 'row',
    gap: 12,
    overflow: 'hidden',
    width: '100%',
  },
  emptyEventsContainer: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
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

const skeletonStyles = StyleSheet.create({
  eventCard: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    overflow: 'hidden',
    width: 248,
  },
  eventImagePlaceholder: {
    height: 80,
    width: '100%',
    backgroundColor: '#D5D5D5',
  },
  eventContent: {
    padding: 12,
    flex: 1,
    justifyContent: 'space-between',
  },
  detailsContainer: {
    marginTop: 'auto',
    gap: 2,
  },
  eventDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  titleSkeleton: {
    marginBottom: 4,
    backgroundColor: '#D5D5D5',
  },
  detailSkeleton: {
    flex: 1,
    backgroundColor: '#D5D5D5',
  },
  iconSkeleton: {
    backgroundColor: '#D5D5D5',
  },
});
