import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  useWindowDimensions,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { useAnalytics } from '@/utils/analytics';
import LessonHeroCard from '../../../components/learn/LessonHeroCard';
import CarouselDots from '../../../components/learn/CarouselDots';
import SectionHeader from '../../../components/learn/SectionHeader';
import PathwayCard from '../../../components/learn/PathwayCard';
import { usePersonalizedModules } from '../../../hooks/learn/usePersonalizedModules';
import { useInProgressLessons } from '../../../hooks/progress/useInProgressLessons';
import {
  CurrentLessonSkeletonLoader,
  PathwayCardSkeletonLoader,
  CarouselDotsSkeletonLoader,
} from '../../../components/learn/learn-index-skeleton-loader';
import TabHeader from '@/components/home/HomeHeader';
import { useProgressCache } from '@/hooks/progress/useProgressCache';
import AnnouncementModal from '@/components/common/AnnouncementModal';

export default function Learn() {
  useProgressCache();
  const { trackScreen } = useAnalytics();
  const isFocused = useIsFocused();
  const [heroIndex, setHeroIndex] = React.useState(0);
  const [refreshing, setRefreshing] = React.useState(false);
  const { width } = useWindowDimensions();
  const sliderRef = React.useRef<ScrollView>(null);

  const { modules, isLoading, error, isPersonalized, refetch } =
    usePersonalizedModules();

  const {
    lessons: inProgressLessons,
    isLoading: lessonsLoading,
    error: lessonsError,
    refresh: refreshLessons,
  } = useInProgressLessons();

  const lastTrackedRef = React.useRef<number>(0);

  useFocusEffect(
    React.useCallback(() => {
      const now = Date.now();
      if (now - lastTrackedRef.current > 500) {
        trackScreen('Learn Screen');
        lastTrackedRef.current = now;
      }
    }, [trackScreen])
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
      await Promise.all([refreshLessons(), refetch()]);
    } finally {
      setRefreshing(false);
    }
  }, [refreshLessons, refetch]);

  // Split modules into active and completed sections
  const activeModules = modules?.filter(m => m.progress !== 'completed') ?? [];
  const completedModules = modules?.filter(m => m.progress === 'completed') ?? [];

  return (
    <View style={styles.root}>
      <TabHeader variant='minimal' />
      <View style={styles.container}>
        <StatusBar style='dark' />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={isFocused && refreshing}
              onRefresh={onRefresh}
            />
          }
        >
          <Text style={styles.pageTitle}>Ready to learn?</Text>
          <Text style={styles.pageSubtitle}>
            Get started with lessons to understand the basics of Canadian
            culture and how to settle in as a newcomer.
          </Text>

          {/* In-progress lesson carousel */}
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

          {/* Active modules (not_started + in_progress), ranked by score */}
          <SectionHeader
            title={isPersonalized ? 'For You' : 'Subjects'}
            style={{ marginTop: 15 }}
          />
          <View style={styles.pathwaysGrid}>
            {isLoading ? (
              <>
                <PathwayCardSkeletonLoader />
                <PathwayCardSkeletonLoader />
              </>
            ) : error ? (
              <Text style={styles.errorText}>Error loading modules</Text>
            ) : activeModules.length > 0 ? (
              activeModules.map((module, index) => {
                const blobIndex = index % 5;
                return (
                  <PathwayCard
                    key={module._id}
                    title={module.title}
                    modulesLabel={`${module.submodules?.length || 0} section${(module.submodules?.length || 0) === 1 ? '' : 's'}`}
                    href={
                      `/(tabs)/Learn/modules/${module._id}?blobIndex=${blobIndex}` as any
                    }
                    colorTheme={module.colorTheme?.hex}
                    icon={module.icon}
                    index={index}
                    moduleId={module._id}
                    progress={module.progress}
                  />
                );
              })
            ) : (
              <Text style={styles.errorText}>No modules available</Text>
            )}
          </View>

          {/* Completed modules section */}
          {completedModules.length > 0 && (
            <>
              <SectionHeader title='Completed' style={{ marginTop: 24 }} />
              <View style={styles.pathwaysGrid}>
                {completedModules.map((module, index) => {
                  const blobIndex = (activeModules.length + index) % 5;
                  return (
                    <PathwayCard
                      key={module._id}
                      title={module.title}
                      modulesLabel={`${module.submodules?.length || 0} section${(module.submodules?.length || 0) === 1 ? '' : 's'}`}
                      href={
                        `/(tabs)/Learn/modules/${module._id}?blobIndex=${blobIndex}` as any
                      }
                      colorTheme={module.colorTheme?.hex}
                      icon={module.icon}
                      index={activeModules.length + index}
                      moduleId={module._id}
                      progress={module.progress}
                    />
                  );
                })}
              </View>
            </>
          )}
        </ScrollView>
      </View>
      <AnnouncementModal
        storageKey='announcement.learnHighlights.v1'
        title='New: Highlight & Ask AI'
        body="Long press any word or phrase in a lesson to highlight it or ask AI to explain it. Your highlights are saved under 'Saved from Learn' in your profile."
        buttonLabel='Got it'
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { padding: 16, paddingBottom: 100 },
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
