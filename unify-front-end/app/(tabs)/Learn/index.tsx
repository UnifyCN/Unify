import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  useWindowDimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import SearchBar from '../../../components/learn/SearchBar';
import LessonHeroCard from '../../../components/learn/LessonHeroCard';
import CarouselDots from '../../../components/learn/CarouselDots';
import SectionHeader from '../../../components/learn/SectionHeader';
import PathwayCard from '../../../components/learn/PathwayCard';
import { useSanityModules } from '../../../hooks/sanity/useSanityModules';
import { useInProgressLessons } from '../../../hooks/progress/useInProgressLessons';
import { urlFor } from '../../../sanity-custom';

export default function Learn() {
  const [heroIndex, setHeroIndex] = React.useState(0);
  const [refreshing, setRefreshing] = React.useState(false);
  const { width } = useWindowDimensions();
  const sliderRef = React.useRef<ScrollView>(null);

  // Fetch all modules with their submodules to get accurate counts
  const { data: modules, isLoading, error } = useSanityModules();

  // Fetch in-progress lessons for the carousel
  const {
    lessons: inProgressLessons,
    isLoading: lessonsLoading,
    error: lessonsError,
    refresh: refreshLessons,
  } = useInProgressLessons();

  const onMomentumEnd = (e: any) => {
    const x = e.nativeEvent?.contentOffset?.x ?? 0;
    const i = Math.round(x / width);
    if (i !== heroIndex && i < inProgressLessons.length) setHeroIndex(i);
  };

  const handleDotPress = (i: number) => {
    if (i < inProgressLessons.length) {
      setHeroIndex(i);
      sliderRef.current?.scrollTo({ x: i * width, animated: true });
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshLessons();
    } finally {
      setRefreshing(false);
    }
  }, [refreshLessons]);
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style='dark' />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.pageTitle}>Let's get started!</Text>

        <SearchBar placeholder='Search for a lesson' />

        <SectionHeader title='Current Lessons' style={{ marginTop: 24 }} />
        {lessonsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size='large' color='#575757' />
            <Text style={styles.loadingText}>Loading your lessons...</Text>
          </View>
        ) : lessonsError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Error loading lessons</Text>
          </View>
        ) : inProgressLessons.length > 0 ? (
          <>
            <View style={[styles.heroWrapper, { width }]}>
              <ScrollView
                ref={sliderRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={onMomentumEnd}
              >
                {inProgressLessons.map((lesson, i) => {
                  const module = modules?.find(m => m._id === lesson.moduleId);
                  const submoduleCount = module?.submodules?.length || 0;
                  const coverImageUrl = module?.coverPhoto ? urlFor(module.coverPhoto) : undefined;
                  const colorHex = module?.colorTheme?.hex;
                  
                  return (
                    <View
                      key={lesson.id}
                      style={{
                        width,
                        paddingRight: 30,
                        paddingVertical: 10,
                        paddingLeft: 1,
                      }}
                    >
                      <LessonHeroCard
                        title={lesson.title}
                        description={lesson.description}
                        moduleTitle={lesson.moduleTitle}
                        submoduleTitle={lesson.submoduleTitle}
                        progressPercent={lesson.progressPercent}
                        currentPage={lesson.currentPage}
                        totalPages={lesson.totalPages}
                        submoduleCount={submoduleCount}
                        coverImageUrl={coverImageUrl}
                        colorHex={colorHex}
                        href={lesson.href as any}
                      />
                    </View>
                  );
                })}
              </ScrollView>
            </View>
            <CarouselDots
              total={inProgressLessons.length}
              activeIndex={heroIndex}
              onDotPress={handleDotPress}
            />
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No lessons to continue</Text>
            <Text style={styles.emptySubtext}>
              Start a lesson to see it here
            </Text>
          </View>
        )}

        <SectionHeader title='Subjects' style={{ marginTop: 24 }} />
        <View style={styles.pathwaysGrid}>
          {isLoading ? (
            // Loading indicator to be waited for design
            <ActivityIndicator size='large' color='#575757' />
          ) : error ? (
            <Text style={styles.errorText}>Error loading modules</Text>
          ) : modules && modules.length > 0 ? (
            modules.map(module => {
              return (
                <PathwayCard
                  key={module._id}
                  title={module.title}
                  modulesLabel={`${module.submodules?.length || 0} section${(module.submodules?.length || 0) === 1 ? '' : 's'}`}
                  href={`/(tabs)/Learn/modules/${module._id}` as any}
                  colorHex={module.colorTheme?.hex}
                  coverImageUrl={module.coverPhoto ? urlFor(module.coverPhoto) : undefined}
                />
              );
            })
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
    fontSize: 24,
    fontWeight: '600',
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
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: '#575757',
    fontSize: 16,
    marginTop: 12,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginHorizontal: 20,
  },
  emptyText: {
    color: '#575757',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#8e8e93',
    fontSize: 14,
  },
});
