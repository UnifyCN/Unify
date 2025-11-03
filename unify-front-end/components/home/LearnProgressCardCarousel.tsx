import React, { useState, useEffect } from 'react';
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
                const lessonsRemaining = totalModuleLessons - completedModuleLessons;

                // Find resume href from in-progress lessons for this module
                const moduleLesson = inProgressLessons?.find(
                  (lesson) => lesson.moduleId === module._id
                );
                const resumeHref =
                  moduleLesson?.href ||
                  `/(tabs)/Learn/modules/${module._id}`;

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
              (l) => l.moduleId === a.module._id
            );
            const bIndex = inProgressLessons.findIndex(
              (l) => l.moduleId === b.module._id
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
        console.error('[LearnProgressCardCarousel] Error calculating module cards:', error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [modulesData, inProgressLessons]);

  const handleResume = (href: string) => {
    router.push(href as any);
  };

  // Don't show anything if loading or no cards
  if (isLoading || lessonsLoading) {
    return null;
  }

  if (moduleCards.length === 0) {
    return null;
  }

  return (
    <View style={[styles.carouselWrapper, { width }]}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.carouselContent}
      >
        {moduleCards.map((card) => {
          const moduleColor = card.module?.colorTheme?.hex || '#666';
          return (
            <View
              key={card.module._id}
              style={[styles.cardContainer, { width }]}
            >
              <View style={styles.progressCard}>
                <Text style={styles.cardProgressText}>
                  You have {card.lessonsRemaining} lesson
                  {card.lessonsRemaining !== 1 ? 's' : ''} left of{' '}
                  <Text style={styles.boldText}>{card.module.title}</Text>
                </Text>
                <Text style={styles.cardPercentageText}>
                  {card.progressPercent}% Completed
                </Text>
                
                {/* Progress Bar with Linear Gradient */}
                <View style={styles.cardProgressBar}>
                  <LinearGradient
                    colors={['#151515', '#595959']}
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
                    { backgroundColor: moduleColor },
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
  );
}

const styles = StyleSheet.create({
  carouselWrapper: {
    marginTop: 16,
  },
  carouselContent: {},
  cardContainer: {
    paddingVertical: 10,
  },
  progressCard: {
    marginHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  cardProgressText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    lineHeight: 22,
  },
  boldText: {
    fontWeight: '600',
  },
  cardPercentageText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  cardProgressBar: {
    height: 8,
    backgroundColor: '#E5E5E5',
    borderRadius: 4,
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
});

