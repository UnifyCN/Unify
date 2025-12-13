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
import { useFocusEffect } from 'expo-router';
import { usePostHog } from 'posthog-react-native';
import SearchBar from '../../../components/learn/SearchBar';
import LessonHeroCard from '../../../components/learn/LessonHeroCard';
import CarouselDots from '../../../components/learn/CarouselDots';
import SectionHeader from '../../../components/learn/SectionHeader';
import PathwayCard from '../../../components/learn/PathwayCard';
import { useSanityModules } from '../../../hooks/sanity/useSanityModules';
import { useInProgressLessons } from '../../../hooks/progress/useInProgressLessons';
import { urlFor } from '../../../sanity-custom';
import {
  CurrentLessonSkeletonLoader,
  PathwayCardSkeletonLoader,
  CarouselDotsSkeletonLoader,
} from '../../../components/learn/learn-index-skeleton-loader';
import Header from '../../../components/Header';

export default function Learn() {
  const posthog = usePostHog();
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

  // Track screen view when Learn screen is focused
  useFocusEffect(
    React.useCallback(() => {
      posthog?.screen('Learn Screen');
    }, [posthog])
  );

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
    <View style={styles.root}>
      <Header showSearchIcon={false} />
      <View style={styles.container}>
        <StatusBar style='dark' />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <Text style={styles.pageTitle}>Ready to learn?</Text>
          <Text style={styles.pageSubtitle}>
            Get started with lessons to understand the basics of Canadian culture and how to settle in as a newcomer.
          </Text>

          {/* <SearchBar placeholder='Search for a lesson' /> */}

          {lessonsLoading ? (
            <>
              <View style={[styles.heroWrapper, { width }]}>
                <View
                  style={{
                    width,
                    paddingRight: 30,
                    paddingVertical: 10,
                    paddingLeft: 1,
                  }}
                >
                  <CurrentLessonSkeletonLoader />
                </View>
              </View>
              <CarouselDotsSkeletonLoader />
            </>
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
                    const module = modules?.find(
                      m => m._id === lesson.moduleId
                    );
                    const submoduleCount = module?.submodules?.length || 0;
                    const coverImageUrl = module?.coverPhoto
                      ? urlFor(module.coverPhoto)
                      : undefined;

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
                          moduleTitle={lesson.moduleTitle}
                          submoduleTitle={lesson.submoduleTitle}
                          currentPage={lesson.currentPage || 1}
                          totalPages={lesson.totalPages || 8}
                          currentSection={lesson.currentSection || 1}
                          totalSections={lesson.totalSections || 1}
                          coverImageUrl={coverImageUrl}
                          colorHex={module?.colorTheme?.hex}
                          icon={module?.icon}
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

          <SectionHeader title='Subjects' style={{ marginTop: 15 }} />
          <View style={styles.pathwaysGrid}>
            {isLoading ? (
              <>
                <PathwayCardSkeletonLoader />
                <PathwayCardSkeletonLoader />
              </>
            ) : error ? (
              <Text style={styles.errorText}>Error loading modules</Text>
            ) : modules && modules.length > 0 ? (
              modules.map((module, index) => {
                const blobIndex = index % 5;
                return (
                  <PathwayCard
                    key={module._id}
                    title={module.title}
                    modulesLabel={`${module.submodules?.length || 0} section${(module.submodules?.length || 0) === 1 ? '' : 's'}`}
                    href={`/(tabs)/Learn/modules/${module._id}?blobIndex=${blobIndex}` as any}
                    colorTheme={module.colorTheme?.hex}
                    icon={module.icon}
                    index={index}
                  />
                );
              })
            ) : (
              <Text style={styles.errorText}>No modules available</Text>
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { padding: 20, paddingBottom: 100 },
  pageTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  pageSubtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#000',
    lineHeight: 20,
    marginBottom: 10,
  },
  heroWrapper: { marginTop: 8 },
  pathwaysGrid: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
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
