import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Event, UserRsvpStatus } from '@/types/events';
import { useState } from 'react';
import { formatEventDate, formatEventTimeRange } from '@/helpers/dateHelpers';
import { useGoingCount } from '@/hooks/events/useGoingCount';
import { useUpsertRsvpStatus } from '@/hooks/events/useUpsertRsvpStatus';

const EventDetailScreen = () => {
  const router = useRouter();
  const { event } = useLocalSearchParams();
  const eventData: Event = JSON.parse(event as string);

  const rsvpOptions = [
    { label: 'Interested', value: UserRsvpStatus.INTERESTED },
    { label: 'Going', value: UserRsvpStatus.GOING },
    { label: 'Not Interested', value: UserRsvpStatus.NOT_INTERESTED },
  ];
  const [showRsvpModal, setShowRsvpModal] = useState(false);

  const [rsvpStatus, setRsvpStatus] = useState<string>(() => rsvpOptions.find(option => option.value === eventData.user_rsvp_status)?.label || 'RSVP');

  const { data: goingCount, isLoading: isGoingCountLoading } = useGoingCount(
    eventData.id
  );
  const upsertRsvpMutation = useUpsertRsvpStatus();

  const handleRsvpSelection = (rsvpStatus: UserRsvpStatus) => {
    upsertRsvpMutation.mutate({
      eventId: eventData.id,
      rsvpStatus,
    });
    setShowRsvpModal(false);
    setRsvpStatus(rsvpOptions.find(option => option.value === rsvpStatus)?.label || 'RSVP');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/Gather/EventsScreen')}
        >
          <Feather name='chevron-left' size={24} color='#fff' />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Event Image */}
        <View style={styles.imageContainer}>
          {eventData.cover_photo_url ? (
            <Image
              source={{ uri: eventData.cover_photo_url }}
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

          {/* Going Count */}
          <Text style={styles.attendeesText}>
            {isGoingCountLoading ? 'Loading...' : `${goingCount} people going`}
          </Text>

            {/* Date and Time */}
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Feather
                  name='calendar'
                  size={20}
                  color='#000'
                />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailTitle}>
                  {formatEventDate(eventData.event_datetime)}
                </Text>
                <Text style={styles.detailSubtitle}>
                  {formatEventTimeRange(
                    eventData.event_datetime,
                    eventData.event_end_datetime || ''
                  )}
                </Text>
              </View>
              {/* No clue what this is supposed to do but it's in the design */}
              <Feather name='chevron-right' size={24} color='#000' />
            </View>

          {/* Location */}
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Feather
                name='map-pin'
                size={20}
                color='#000'
              />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailTitle}>{eventData.location}</Text>
              <Text style={styles.detailSubtitle}>{eventData.address}</Text>
            </View>
            {/* No clue what this is supposed to do but it's in the design */}
            <Feather name='chevron-right' size={24} color='#000' />
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

      {/* RSVP Button */}
      <View style={styles.rsvpContainer}>
        <TouchableOpacity
          style={styles.rsvpButton}
          onPress={() => setShowRsvpModal(true)}
        >
          <Text style={styles.rsvpButtonText}>{rsvpStatus}</Text>
          <Feather name='chevron-down' size={24} color='#000' />
        </TouchableOpacity>
      </View>

      {/* RSVP Modal */}
      <Modal
        visible={showRsvpModal}
        transparent={true}
        onRequestClose={() => setShowRsvpModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowRsvpModal(false)}>
                <Text style={styles.cancelButton}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Your Response</Text>
              <View style={styles.placeholder} />
            </View>

            {/* RSVP Options */}
            <View style={styles.rsvpOptions}>
              {rsvpOptions.map(option => (
                 <TouchableOpacity
                   style={styles.rsvpOption}
                   key={option.value}
                   onPress={() =>
                     handleRsvpSelection(option.value as UserRsvpStatus)
                   }
                 >
                   <View style={[
                     styles.checkbox,
                     rsvpStatus === option.label && styles.checkboxSelected
                   ]}>
                     {rsvpStatus === option.label && (
                       <Feather name='check' size={16} color='#fff' />
                     )}
                   </View>
                   <Text style={styles.rsvpOptionText}>{option.label}</Text>
                 </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
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
    paddingTop: 32,
    paddingBottom: 16,
    backgroundColor: '#C4C4C4',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
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
    marginBottom: 8,
  },
  attendeesText: {
    fontSize: 14,
    color: '#979797',
    marginBottom: 24,
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
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  detailSubtitle: {
    fontSize: 12,
    color: '#979797',
  },
  aboutSection: {
    marginTop: 20,
  },
  aboutTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  aboutText: {
    fontSize: 14,
    color: '#000',
    lineHeight: 24,
    marginBottom: 12,
  },
  rsvpContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  rsvpButton: {
    backgroundColor: '#E3E3E3',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rsvpButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cancelButton: {
    fontSize: 18,
    fontWeight: '400',
    color: '#343434',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  rsvpOptions: {
    padding: 20,
  },
  rsvpOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 4,
    backgroundColor: '#fff',
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  rsvpOptionText: {
    fontSize: 16,
    color: '#000',
  },
});

export default EventDetailScreen;
