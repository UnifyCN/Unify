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
import { SkeletonLoader } from './SkeletonLoader';
import { Theme } from '@/constants/Theme';
import ViewMoreCardEvents from '@/components/icons/ViewMoreCardEvents.svg';
import EmptyFeedMessage from '@/components/profile/EmptyFeedMessage';

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
            <SkeletonLoader
              width={14}
              height={18}
              borderRadius={10}
              style={skeletonStyles.iconSkeleton}
            />
            <SkeletonLoader
              width='75%'
              height={18}
              borderRadius={4}
              style={skeletonStyles.detailSkeleton}
            />
          </View>

          <View style={skeletonStyles.eventDetail}>
            <SkeletonLoader
              width={14}
              height={18}
              borderRadius={10}
              style={skeletonStyles.iconSkeleton}
            />
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
      return eventDate >= now;
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
        {!isLoading && upcomingEvents.length === 0 && (
          <View style={styles.emptyEventsContainer}>
            <EmptyFeedMessage
              icon={<Feather name='calendar' size={24} color='#B4B1B1' />}
              message='No events available'
              submessage={
                <Text
                  style={{
                    fontSize: 14,
                    color: Theme.textInput,
                    textAlign: 'center',
                    lineHeight: 20,
                  }}
                >
                  Check back later for new events
                </Text>
              }
            />
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
          <TouchableOpacity
            style={styles.viewMoreCard}
            onPress={handleViewMore}
            activeOpacity={0.7}
          >
            <View style={styles.viewMoreContent}>
              <ViewMoreCardEvents 
                width={248}
                height="100%"
                preserveAspectRatio="none"
              />
              <View style={styles.viewMoreTextOverlay}>
                <Text style={styles.viewMoreText}>
                  View more events{' '}
                  <Feather name='arrow-right' size={16} color={Theme.black} />
                </Text>
                <Text style={styles.viewMoreSubtext}>
                  There's more to check out!
                </Text>
              </View>
            </View>
          </TouchableOpacity>
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
  },
  viewMoreCard: {
    width: 248,
    alignSelf: 'stretch',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
  },
  viewMoreContent: {
    width: 248,
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewMoreTextOverlay: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  viewMoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.black,
  },
  viewMoreSubtext: {
    fontSize: 14,
    color: Theme.black,
  },
});

const skeletonStyles = StyleSheet.create({
  eventCard: {
    backgroundColor: '#f0f0f0',
    borderRadius: 15,
    overflow: 'hidden',
    width: 248,
  },
  eventImagePlaceholder: {
    height: 86,
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
