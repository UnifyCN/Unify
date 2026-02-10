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
import { useEffect, useMemo, useState } from 'react';
import { getEventById } from '@/services/events/getEventById';
import { useAnalytics } from '@/utils/analytics';
import BackHeader from '@/components/BackHeader';

const EventDetailScreen = () => {
  const router = useRouter();
  const { event, eventId } = useLocalSearchParams();
  const [eventData, setEventData] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  // Memoize parsed event data with safety handling
  const parsedEvent: Event | null = useMemo(() => {
    try {
      if (!event) return null;
      return JSON.parse(event as string);
    } catch (error) {
      console.error('Failed to parse event data:', error);
      return null;
    }
  }, [event]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);

      // A) If old param "event" exists, use it
      if (parsedEvent) {
        if (!cancelled) {
          setEventData(parsedEvent);
          setLoading(false);
        }
        return;
      }

      // B) Else use new param "eventId"
      const idNum =
        typeof eventId === 'string'
          ? Number(eventId)
          : Array.isArray(eventId)
            ? Number(eventId[0])
            : NaN;

      if (!Number.isFinite(idNum)) {
        if (!cancelled) {
          setLoading(false);
          router.back();
        }
        return;
      }

      try {
        const fetched = await getEventById(idNum);
        if (!cancelled) {
          if (!fetched) {
            setLoading(false);
            router.back();
            return;
          }
          setEventData(fetched);
          setLoading(false);
        }
      } catch (e) {
        console.error('Failed to fetch event by id:', e);
        if (!cancelled) {
          setLoading(false);
          router.back();
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [parsedEvent, eventId, router]);

  const { trackEventViewed, trackEventShared, trackEventExternalLinkClicked } =
    useAnalytics();


  // Track event view on mount
  useEffect(() => {
    if (eventData) {
      trackEventViewed(eventData.id.toString(), eventData.title);
    }
  }, [eventData, trackEventViewed]);

  if (loading) return null;
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
      {/* Header - Using BackHeader component with share button */}
      <BackHeader
        rightButton={
          <TouchableOpacity onPress={handleShare}>
            <Feather name='upload' size={24} color={Theme.black} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Event Title */}
        <Text style={styles.eventTitle}>{eventData.title}</Text>

        {/* Event Image - Card style (now directly after title) */}
        {eventData.coverPhotoUrl ? (
          <Image
            source={{ uri: eventData.coverPhotoUrl }}
            style={styles.eventImage}
            resizeMode='cover'
          />
        ) : (
          <View style={styles.imagePlaceholder} />
        )}

        {/* Metadata - Date and Time */}
        <View style={styles.metadataRow}>
          <Feather
            name='calendar'
            size={16}
            color={Theme.textAlternateGray}
            style={styles.metadataIcon}
          />
          <Text style={styles.metadataText}>
            {formatEventDate(eventData.eventDatetime)}
            {eventData.eventEndDatetime && (
              <Text style={styles.metadataSecondary}>
                {' '}
                · {formatEventTimeRange(eventData.eventDatetime, eventData.eventEndDatetime)}
              </Text>
            )}
          </Text>
        </View>

        {/* Metadata - Location */}
        <View style={styles.metadataRow}>
          <Feather
            name='map-pin'
            size={16}
            color={Theme.textAlternateGray}
            style={styles.metadataIcon}
          />
          <View style={styles.metadataContent}>
            <Text style={styles.metadataText}>{eventData.location}</Text>
            {eventData.address && (
              <Text style={styles.metadataSecondary}>{eventData.address}</Text>
            )}
          </View>
        </View>

        {/* Metadata - Hosted By */}
        {eventData.hostedBy && (
          <View style={styles.metadataRow}>
            <Feather
              name='user'
              size={16}
              color={Theme.textAlternateGray}
              style={styles.metadataIcon}
            />
            <Text style={styles.metadataText}>
              Hosted by <Text style={styles.metadataHighlight}>{eventData.hostedBy}</Text>
            </Text>
          </View>
        )}

        {/* CTA Button - View Event Details (now placed after metadata, before About) */}
        {eventData.externalLink && (
          <TouchableOpacity
            onPress={handleExternalLink}
            style={styles.ctaButton}
          >
            <Text style={styles.ctaButtonText}>View Event Details</Text>
            <Feather name='external-link' size={18} color={Theme.white} />
          </TouchableOpacity>
        )}

        {/* About Event */}
        <Text style={styles.aboutTitle}>About Event</Text>
        {eventData.description ? (
          <Text style={styles.aboutText}>{eventData.description}</Text>
        ) : (
          <Text style={styles.aboutText}>
            No description available for this event.
          </Text>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.white,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 4,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  eventTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Theme.black,
    marginBottom: 12,
    lineHeight: 28,
  },
  eventImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 20,
    backgroundColor: Theme.imagePlaceholder,
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 20,
    backgroundColor: Theme.imagePlaceholder,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  metadataIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  metadataContent: {
    flex: 1,
  },
  metadataText: {
    fontSize: 16,
    color: Theme.black,
    lineHeight: 22,
  },
  metadataSecondary: {
    fontSize: 16,
    color: Theme.textPostTime,
    lineHeight: 22,
  },
  metadataHighlight: {
    fontWeight: '700',
  },
  ctaButton: {
    backgroundColor: Theme.surfaceBlue,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  ctaButtonText: {
    color: Theme.white,
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  aboutTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Theme.black,
    marginBottom: 12,
  },
  aboutText: {
    fontSize: 18,
    color: Theme.black,
    lineHeight: 27,
  },
});

export default EventDetailScreen;
