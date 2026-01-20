import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Linking,
  Share,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Event } from '@/types/events';
import { formatEventDate, formatEventTimeRange } from '@/helpers/dateHelpers';
import { Theme } from '@/constants/Theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect, useMemo } from 'react';
import { useAnalytics } from '@/utils/analytics';

const EventDetailScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { event } = useLocalSearchParams();

  // Memoize parsed event data with safety handling
  const eventData: Event | null = useMemo(() => {
    try {
      if (!event) return null;
      return JSON.parse(event as string);
    } catch (error) {
      console.error('Failed to parse event data:', error);
      return null;
    }
  }, [event]);

  const { trackEventViewed, trackEventShared, trackEventExternalLinkClicked } =
    useAnalytics();

  // Handle redirect if event data is missing or invalid
  useEffect(() => {
    if (!eventData) {
      router.back();
    }
  }, [eventData, router]);

  // Track event view on mount
  useEffect(() => {
    if (eventData) {
      trackEventViewed(eventData.id.toString(), eventData.title);
    }
  }, [eventData, trackEventViewed]);

  if (!eventData) return null;

  const handleExternalLink = () => {
    if (eventData.externalLink) {
      trackEventExternalLinkClicked(eventData.id.toString(), eventData.title);
      Linking.openURL(eventData.externalLink);
    }
  };

  // Using react native built in share
  const handleShare = async () => {
    try {
      trackEventShared(eventData.id.toString(), eventData.title);
      const shareMessage = [
        `Check out this event: ${eventData.title}`,
        `📅 ${formatEventDate(eventData.eventDatetime)}`,
        `📍 ${eventData.location}`,
        `🔗 ${eventData.externalLink}`,
      ].join('\n\n');

      await Share.share({
        message: shareMessage,
        title: 'Unify Gather',
        url: eventData.externalLink,
      });
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code !== 'SHARE_CANCELLED'
      ) {
        console.error('Error sharing event:', error);
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 24 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name='chevron-left' size={24} color={Theme.white} />
        </TouchableOpacity>
        {/* Share Button */}
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={handleShare}>
            <Feather name='upload' size={24} color={Theme.white} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Event Image */}
        <View style={styles.imageContainer}>
          {/* TODO: Not entirely sure how to handle cover photos but for now its just placeholders */}
          {eventData.coverPhotoUrl ? (
            <Image
              source={{ uri: eventData.coverPhotoUrl }}
              style={styles.eventImage}
            />
          ) : (
            <View style={styles.imagePlaceholder} />
          )}
        </View>

        {/* Event Content */}
        <View style={styles.eventContent}>
          {/* Title */}
          <Text style={styles.eventTitle}>{eventData.title}</Text>

          {/* Date and Time */}
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Feather name='calendar' size={20} color='#000' />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailTitle}>
                {formatEventDate(eventData.eventDatetime)}
              </Text>
              <Text style={styles.detailSubtitle}>
                {formatEventTimeRange(
                  eventData.eventDatetime,
                  eventData.eventEndDatetime || ''
                )}
              </Text>
            </View>
          </View>

          {/* Location */}
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Feather name='map-pin' size={20} color='#000' />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailTitle}>{eventData.location}</Text>
              <Text style={styles.detailSubtitle}>{eventData.address}</Text>
            </View>
          </View>

          {/* About Event */}
          <View style={styles.aboutSection}>
            <Text style={styles.aboutTitle}>About Event</Text>
            {eventData.description ? (
              <Text style={styles.aboutText}>{eventData.description}</Text>
            ) : (
              <Text style={styles.aboutText}>
                No description available for this event.
              </Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* External Link Button */}
      <View style={styles.externalLinkContainer}>
        <TouchableOpacity
          style={styles.externalLinkButton}
          onPress={handleExternalLink}
        >
          <Text style={styles.externalLinkButtonText}>View Event Details</Text>
          <Feather name='external-link' size={20} color='#fff' />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#C4C4C4',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#C4C4C4',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    height: 250,
    backgroundColor: '#C4C4C4',
  },
  eventImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#C4C4C4',
  },
  eventContent: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: -20,
    height: '100%',
  },
  eventTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#343434',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  detailIcon: {
    marginRight: 16,
    borderWidth: 0.5,
    borderColor: '#979797',
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 5,
  },
  detailContent: {
    flex: 1,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  detailSubtitle: {
    fontSize: 16,
    color: '#979797',
  },
  aboutSection: {
    marginTop: 10,
  },
  aboutTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  aboutText: {
    fontSize: 18,
    color: '#000',
    lineHeight: 24,
    marginBottom: 12,
  },
  externalLinkContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  externalLinkButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  externalLinkButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
});

export default EventDetailScreen;
