import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSanityModules } from '@/hooks/sanity/useSanityModules';
import { useInProgressLessons } from '@/hooks/progress/useInProgressLessons';
import { cachedProgressService } from '@/services/progress/cachedProgressService';
import CarouselDots from '@/components/learn/CarouselDots';
import { CarouselDotsSkeletonLoader } from '@/components/learn/learn-index-skeleton-loader';
import { LearnProgressCardSkeletonLoader } from './LearnProgressCardSkeletonLoader';

interface ModuleProgressCard {
  module: any;
  progressPercent: number;
  lessonsRemaining: number;
  resumeHref: string;
}

export default function LearnProgressCardCarousel() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [moduleCards, setModuleCards] = useState<ModuleProgressCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [heroIndex, setHeroIndex] = useState(0);
  const sliderRef = useRef<ScrollView>(null);
  const { data: modulesData } = useSanityModules();
  const { lessons: inProgressLessons, isLoading: lessonsLoading } =
    useInProgressLessons();

  // Calculate module cards for all modules with progress between 1% and 100%
  useEffect(() => {
    if (!modulesData) return;

    (async () => {
      try {
        setIsLoading(true);
        const cards: ModuleProgressCard[] = [];

        // Process all modules in parallel
        await Promise.all(
          modulesData.map(async (module: any) => {
            try {
              // Calculate module-level stats using cached progress service
              let totalModuleLessons = 0;
              let completedModuleLessons = 0;

              for (const submodule of module.submodules || []) {
                try {
                  const submoduleProgress =
                    await cachedProgressService.getSubmoduleProgress(
                      module._id,
                      submodule._id
                    );
                  if (submoduleProgress) {
                    totalModuleLessons += submoduleProgress.total_lessons || 0;
                    completedModuleLessons +=
                      submoduleProgress.completed_lessons || 0;
                  }
                } catch (error) {
                  // Continue if we can't get progress for one submodule
                }
              }

              const progressPercent =
                totalModuleLessons > 0
                  ? Math.round(
                      (completedModuleLessons / totalModuleLessons) * 100
                    )
                  : 0;

              // Only include modules with progress between 1% and 100%
              if (progressPercent > 1 && progressPercent < 100) {
                const lessonsRemaining =
                  totalModuleLessons - completedModuleLessons;

                // Find resume href from in-progress lessons for this module
                const moduleLesson = inProgressLessons?.find(
                  lesson => lesson.moduleId === module._id
                );
                const resumeHref =
                  moduleLesson?.href || `/(tabs)/Learn/modules/${module._id}`;

                cards.push({
                  module,
                  progressPercent,
                  lessonsRemaining,
                  resumeHref,
                });
              }
            } catch (error) {
              console.error(
                `[LearnProgressCardCarousel] Error processing module ${module._id}:`,
                error
              );
            }
          })
        );

        // Sort by most recently accessed (use inProgressLessons order - first lesson is most recent)
        if (inProgressLessons && inProgressLessons.length > 0) {
          cards.sort((a, b) => {
            const aIndex = inProgressLessons.findIndex(
              l => l.moduleId === a.module._id
            );
            const bIndex = inProgressLessons.findIndex(
              l => l.moduleId === b.module._id
            );
            // Put modules with lessons first, sorted by lesson order
            if (aIndex >= 0 && bIndex >= 0) return aIndex - bIndex;
            if (aIndex >= 0) return -1;
            if (bIndex >= 0) return 1;
            return 0;
          });
        }

        setModuleCards(cards);
      } catch (error) {
        console.error(
          '[LearnProgressCardCarousel] Error calculating module cards:',
          error
        );
      } finally {
        setIsLoading(false);
      }
    })();
  }, [modulesData, inProgressLessons]);

  const onMomentumEnd = (e: any) => {
    const x = e.nativeEvent?.contentOffset?.x ?? 0;
    const i = Math.round(x / width);
    if (i !== heroIndex && i < moduleCards.length) setHeroIndex(i);
  };

  const handleDotPress = (i: number) => {
    if (i < moduleCards.length) {
      setHeroIndex(i);
      sliderRef.current?.scrollTo({ x: i * width, animated: true });
    }
  };

  const handleResume = (href: string) => {
    router.push(href as any);
  };

  // Show skeleton loader while loading
  if (isLoading || lessonsLoading) {
    return (
      <>
        <View style={[styles.heroWrapper, { width }]}>
          <View
            style={{
              width,
              paddingRight: 43,
              paddingVertical: 10,
              paddingLeft: 1,
            }}
          >
            <LearnProgressCardSkeletonLoader />
          </View>
        </View>
        <CarouselDotsSkeletonLoader />
      </>
    );
  }

  // Show empty state if no cards
  if (moduleCards.length === 0) {
    return (
      <View style={[styles.heroWrapper, { width }]}>
        <View
          style={{
            width,
            paddingRight: 43,
            paddingVertical: 10,
            paddingLeft: 1,
          }}
        >
          <View style={styles.progressCard}>
            {/* Empty placeholder to match normal card height */}
            <View style={styles.emptyPlaceholder}>
              <Text style={styles.emptyStateText}>No modules in progress</Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <>
      <View style={[styles.heroWrapper, { width }]}>
        <ScrollView
          ref={sliderRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onMomentumEnd}
        >
          {moduleCards.map((card, i) => {
            const moduleColor = card.module?.colorTheme?.hex || '#666';
            return (
              <View
                key={card.module._id}
                style={{
                  width,
                  paddingRight: 43,
                  paddingVertical: 10,
                  paddingLeft: 1,
                }}
              >
                <View style={styles.progressCard}>
                  <Text style={styles.cardProgressText}>
                    You have {card.lessonsRemaining} lesson
                    {card.lessonsRemaining !== 1 ? 's' : ''} left in{' '}
                    <Text style={styles.boldText}>{card.module.title}</Text>
                  </Text>
                  <Text style={styles.cardPercentageText}>
                    {card.progressPercent}% Completed
                  </Text>

                  {/* Progress Bar with Linear Gradient */}
                  <View style={styles.cardProgressBar}>
                    <LinearGradient
                      colors={['#D8492C', '#FFB570']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[
                        styles.progressFill,
                        {
                          width: `${Math.min(100, Math.max(0, card.progressPercent))}%`,
                        },
                      ]}
                    />
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.cardResumeButton,
                      { backgroundColor: '#D8492C' },
                    ]}
                    onPress={() => handleResume(card.resumeHref)}
                  >
                    <Text style={styles.cardResumeButtonText}>
                      Resume Lesson
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>
      <CarouselDots
        total={moduleCards.length}
        activeIndex={heroIndex}
        onDotPress={handleDotPress}
      />
    </>
  );
}

const styles = StyleSheet.create({
  heroWrapper: {
    marginTop: 8,
  },
  progressCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  cardProgressText: {
    fontSize: 18,
    color: '#000',
    marginBottom: 16,
    lineHeight: 22,
  },
  boldText: {
    fontWeight: '600',
  },
  cardPercentageText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    marginBottom: 8,
  },
  cardProgressBar: {
    height: 11,
    backgroundColor: '#E5E5E5',
    borderRadius: 20,
    marginBottom: 20,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  cardResumeButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardResumeButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  emptyPlaceholder: {
    minHeight: 153, // Match height of content in normal card (text + percentage + bar + button)
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
