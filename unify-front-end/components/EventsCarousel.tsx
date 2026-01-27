import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEvents } from '@/hooks/events/useEvents';
import EventCard from '@/components/events/EventCard';
import { SkeletonLoader } from './SkeletonLoader';
import { Theme } from '@/constants/Theme';
import ViewMoreCardEvents from '@/components/icons/ViewMoreCardEvents.svg';
import EmptyFeedMessage from '@/components/profile/EmptyFeedMessage';
import { HorizontalCarousel } from './HorizontalCarousel';

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

  const handleEventPress = (event: any) => {
    router.push({
      pathname: '/event-detail' as any,
      params: { event: JSON.stringify(event) },
    });
  };

  const handleViewMore = () => {
    router.push('/events' as any);
  };

  return (
    <View style={style}>
      <HorizontalCarousel
        title={title}
        titleStyle={titleStyle}
        data={upcomingEvents}
        isLoading={isLoading}
        maxItems={maxEvents}
        itemKeyExtractor={item => item.id}
        renderItem={item => (
          <EventCard event={item} onPress={() => handleEventPress(item)} />
        )}
        renderLoadingSkeleton={() => <EventSkeletonCard />}
        renderEmptyState={() => (
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
        )}
        renderViewMore={() => (
          <TouchableOpacity
            style={styles.viewMoreCard}
            onPress={handleViewMore}
            activeOpacity={0.7}
          >
            <View style={styles.viewMoreContent}>
              <ViewMoreCardEvents
                width={248}
                height='100%'
                preserveAspectRatio='none'
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
        onViewMore={showViewMore ? handleViewMore : undefined}
        showViewMore={showViewMore}
        scrollViewStyle={styles.eventsCarousel}
        contentContainerStyle={contentContainerStyle}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  eventsCarousel: {
    marginBottom: 20,
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
