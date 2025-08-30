import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import SearchBar from '../../../components/learn/SearchBar';
import LessonHeroCard from '../../../components/learn/LessonHeroCard';
import CarouselDots from '../../../components/learn/CarouselDots';
import SectionHeader from '../../../components/learn/SectionHeader';
import PathwayCard from '../../../components/learn/PathwayCard';

export default function Learn() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style='dark' />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.pageTitle}>Let's get started!</Text>

        <SearchBar placeholder='Search for a lesson' />

        <SectionHeader title='Current Lessons' style={{ marginTop: 24 }} />
        <View style={styles.heroWrapper}>
          <LessonHeroCard />
        </View>
        <CarouselDots total={3} activeIndex={0} />

        <SectionHeader title='Learning Pathways' style={{ marginTop: 24 }} />
        <View style={styles.pathwaysGrid}>
          <PathwayCard title='Finance for Newcomers' modulesLabel='8 Modules' />
          <PathwayCard title='Employment' modulesLabel='5 Modules' />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    marginBottom: 16,
  },
  heroWrapper: { marginTop: 8 },
  pathwaysGrid: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
});
