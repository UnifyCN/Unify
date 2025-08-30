import { useState, memo, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import Header from '@/components/Header';

const WelcomeSection = () => (
  <View style={styles.welcomeSection}>
    <Text style={styles.welcomeText}>
      Welcome Back, <Text style={styles.welcomeName}>Sarab!</Text>
    </Text>
    <Text style={styles.progressText}>
      You have two modules left of{' '}
      <Text style={styles.boldText}>Understanding Canadian Banking</Text>
    </Text>
    <Text style={styles.percentageText}>55% Completed</Text>
    <View style={styles.progressBar}>
      <View style={styles.progressFill} />
    </View>
    <TouchableOpacity style={styles.resumeButton}>
      <Text style={styles.resumeButtonText}>Resume Lesson</Text>
    </TouchableOpacity>
  </View>
);

const NewsTipsSection = () => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>News & Tips</Text>
      <Feather name='chevron-right' size={20} color='#666' />
    </View>
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.carousel}
    >
      <View style={styles.newsCard}>
        <View style={styles.newsImagePlaceholder} />
        <View style={styles.newsContent}>
          <Text style={styles.newsTitle}>Navigating Winter Roads</Text>
          <Text style={styles.newsDescription}>
            New to snow? ICBC article to help you avoid issues on the icy,
            winter roads.
          </Text>
        </View>
      </View>
      <View style={styles.newsCard}>
        <View style={styles.newsImagePlaceholder} />
        <View style={styles.newsContent}>
          <Text style={styles.newsTitle}>Financial Planning Tips</Text>
          <Text style={styles.newsDescription}>
            Essential tips for managing your finances in Canada.
          </Text>
        </View>
      </View>
    </ScrollView>
  </View>
);

const GatherEventsSection = () => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>Upcoming Gather Events</Text>
      <Feather name='chevron-right' size={20} color='#666' />
    </View>
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.carousel}
    >
      <View style={styles.eventCard}>
        <View style={styles.eventImagePlaceholder} />
        <Text style={styles.eventTitle}>Community Meetup</Text>
      </View>
      <View style={styles.eventCard}>
        <View style={styles.eventImagePlaceholder} />
        <Text style={styles.eventTitle}>Study Group</Text>
      </View>
      <View style={styles.eventCard}>
        <View style={styles.eventImagePlaceholder} />
        <Text style={styles.eventTitle}>Workshop</Text>
      </View>
    </ScrollView>
  </View>
);

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style='dark' />
      <Header />
      <ScrollView style={styles.scrollView}>
        <WelcomeSection />
        <NewsTipsSection />
        <GatherEventsSection />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  welcomeSection: {
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  welcomeName: {
    fontStyle: 'italic',
  },
  progressText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    lineHeight: 22,
  },
  boldText: {
    fontWeight: '600',
  },
  percentageText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E5E5',
    borderRadius: 4,
    marginBottom: 20,
  },
  progressFill: {
    height: '100%',
    width: '55%',
    backgroundColor: '#666',
    borderRadius: 4,
  },
  resumeButton: {
    backgroundColor: '#E5E5E5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: 'center',
  },
  resumeButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  carousel: {
    paddingLeft: 20,
  },
  newsCard: {
    width: 280,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginRight: 16,
    padding: 16,
    flexDirection: 'row',
  },
  newsImagePlaceholder: {
    width: 60,
    height: 60,
    backgroundColor: '#666',
    borderRadius: 8,
    marginRight: 12,
  },
  newsContent: {
    flex: 1,
  },
  newsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  newsDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  eventCard: {
    width: 160,
    height: 120,
    backgroundColor: '#666',
    borderRadius: 12,
    marginRight: 16,
    justifyContent: 'flex-end',
    padding: 12,
  },
  eventImagePlaceholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#666',
    borderRadius: 12,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    zIndex: 1,
  },
});
