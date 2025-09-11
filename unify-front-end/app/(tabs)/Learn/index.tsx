import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, useWindowDimensions, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import SearchBar from '../../../components/learn/SearchBar';
import LessonHeroCard from '../../../components/learn/LessonHeroCard';
import CarouselDots from '../../../components/learn/CarouselDots';
import SectionHeader from '../../../components/learn/SectionHeader';
import PathwayCard from '../../../components/learn/PathwayCard';
import { useAllModules } from '../../../hooks/learn/useAllModules';

export default function Learn() {
  const [heroIndex, setHeroIndex] = React.useState(0);
  const heroSlides = [0, 1, 2];
  const { width } = useWindowDimensions();
  const sliderRef = React.useRef<ScrollView>(null);
  
  // Fetch all modules dynamically
  const { data: modules, isLoading, error } = useAllModules();

  const onMomentumEnd = (e: any) => {
    const x = e.nativeEvent?.contentOffset?.x ?? 0;
    const i = Math.round(x / width);
    if (i !== heroIndex) setHeroIndex(i);
  };

  const handleDotPress = (i: number) => {
    setHeroIndex(i);
    sliderRef.current?.scrollTo({ x: i * width, animated: true });
  };
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style='dark' />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.pageTitle}>Let's get started!</Text>

        <SearchBar placeholder='Search for a lesson' />

        <SectionHeader title='Current Lessons' style={{ marginTop: 24 }} />
        <View style={[styles.heroWrapper, { width }]}> 
          <ScrollView
            ref={sliderRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onMomentumEnd}
          >
            {heroSlides.map(i => (
              <View key={i} style={{ width, paddingRight: 30, paddingVertical: 10, paddingLeft: 1 }}>
                <LessonHeroCard />
              </View>
            ))}
          </ScrollView>
        </View>
        <CarouselDots total={heroSlides.length} activeIndex={heroIndex} onDotPress={handleDotPress} />

        <SectionHeader title='Learning Pathways' style={{ marginTop: 24 }} />
        <View style={styles.pathwaysGrid}>
          {isLoading ? (
            <ActivityIndicator size="large" color="#007AFF" />
          ) : error ? (
            <Text style={styles.errorText}>Error loading modules</Text>
          ) : modules && modules.length > 0 ? (
            modules.map((module) => (
              <PathwayCard
                key={module.id}
                title={module.title}
                modulesLabel={`${module.completed_submodules}/${module.total_submodules} Modules`}
                href={`/(tabs)/Learn/modules/${module.id}` as any}
              />
            ))
          ) : (
            <Text style={styles.errorText}>No modules available</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { padding: 20, paddingBottom: 100 },
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
  errorText: {
    color: '#FF3B30',
    textAlign: 'center',
    marginTop: 20,
  },
});
