import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Group } from '@/types/groups';

const GroupDetailScreen = () => {
  const params = useLocalSearchParams();
  let group: Group | null = null;

  if (params.group) {
    try {
      group = JSON.parse(params.group as string);
    } catch (e) {
      group = null;
    }
  }

  if (!group) {
    return (
      <View style={styles.container}>
        <Text>Group details not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator>
        <Text style={styles.aboutTitle}>{group.name}</Text>
        <Text style={styles.aboutText}>{group.description}</Text>
        {/* Add more group details here as needed */}
      </ScrollView>
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
  rsvpEndedText: {
    color: '#929292',
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

export default GroupDetailScreen;
