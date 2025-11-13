import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSanitySubmoduleWithLessons } from '@/hooks/sanity/useSanitySubmodules';
import { useSanityModule } from '@/hooks/sanity/useSanityModules';
import { useLessonProgress } from '@/hooks/progress/useLessonProgress';
import { getLessonProgress } from '@/services/progress/progressService';
import { Feather } from '@expo/vector-icons';
import Header from '@/components/Header';

export default function SubmoduleMap() {
  const router = useRouter();
  const { moduleId, submoduleId } = useLocalSearchParams<{
    moduleId: string;
    submoduleId: string;
  }>();

  const {
    data: submoduleData,
    isLoading,
    error,
  } = useSanitySubmoduleWithLessons(submoduleId || '');
  const { data: moduleData } = useSanityModule(moduleId || '');

  // Add state for expanded lessons
  const [expandedLessonIndex, setExpandedLessonIndex] = useState<number | null>(
    null
  );

  // Progress tracking state
  const [lessonProgresses, setLessonProgresses] = useState<{
    [key: string]: any;
  }>({});
  const [progressLoading, setProgressLoading] = useState(true);

  // Fetch lesson progress data
  useEffect(() => {
    if (submoduleData?.lessons) {
      const fetchLessonProgress = async () => {
        setProgressLoading(true);
        const progressData: { [key: string]: any } = {};

        for (const lesson of submoduleData.lessons) {
          try {
            const progress = await getLessonProgress(lesson._id);
            progressData[lesson._id] = progress;
          } catch (error) {
            console.error(
              `Error fetching progress for lesson ${lesson._id}:`,
              error
            );
            // Set default values if progress fetching fails
            progressData[lesson._id] = {
              is_completed: false,
              is_in_progress: false,
              progress_percent: 0,
            };
          }
        }

        setLessonProgresses(progressData);
        setProgressLoading(false);
      };

      fetchLessonProgress();
    }
  }, [submoduleData?.lessons]);

  if (isLoading || progressLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <Header />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading submodule...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !submoduleData) {
    return (
      <SafeAreaView style={styles.safe}>
        <Header />
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>
            Error loading submodule: {error?.message || 'Unknown error'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Determine lesson states based on progress data
  const circles = submoduleData.lessons.map(
    (lesson: any, index: number, arr: any[]) => {
      const progress = lessonProgresses[lesson._id];
      const isCompleted = progress?.is_completed || false;
      const isInProgress = progress?.is_in_progress || false;

      // Determine if lesson is active (next in line or in progress)
      let isActive = false;
      if (isInProgress) {
        isActive = true; // Currently in progress
      } else if (index === 0) {
        isActive = true; // First lesson is always active
      } else {
        // Check if previous lesson is completed
        const previousLesson = arr[index - 1];
        const previousProgress = lessonProgresses[previousLesson._id];
        const previousCompleted = previousProgress?.is_completed || false;
        isActive = previousCompleted; // Active if previous is completed
      }

      // Determine if lesson is blocked (non-active)
      const blocked = !isActive && !isCompleted;

      return {
        id: lesson._id, // Use Sanity _id
        title: lesson.title,
        orderNumber: lesson.order, // Use Sanity order field
        index: index + 1,
        isCompleted,
        isNext: isActive && !isInProgress, // Next in line
        inProgress: isInProgress,
        blocked,
        progressPercent: progress?.progress_percent || 0,
      };
    }
  );

  // Find the next lesson based on progress
  const nextLesson = submoduleData.lessons.find((lesson: any) => {
    const progress = lessonProgresses[lesson._id];
    return (
      !progress?.is_completed &&
      (progress?.is_in_progress ||
        submoduleData.lessons.indexOf(lesson) === 0 ||
        (submoduleData.lessons.indexOf(lesson) > 0 &&
          lessonProgresses[
            submoduleData.lessons[submoduleData.lessons.indexOf(lesson) - 1]._id
          ]?.is_completed))
    );
  });

  return (
    <SafeAreaView style={styles.safe}>
      <Header />
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with module name */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() =>
              router.replace({
                pathname: '/(tabs)/Learn/modules/[moduleId]',
                params: { moduleId },
              })
            }
            style={styles.backButton}
          >
            <Feather name='arrow-left' size={24} color='#000' />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle} numberOfLines={2}>
              {moduleData?.title || 'Module'}
            </Text>
            <View style={styles.lessonCountContainer}>
              <Feather name='book-open' size={14} color='#666' />
              <Text style={styles.lessonCount}>
                {submoduleData.lessons?.length || 0} Lessons
              </Text>
            </View>
          </View>
        </View>

        {/* Lesson Cards */}
        <View style={styles.lessonsContainer}>
          {circles.map((c, i) => {
            const lesson = submoduleData.lessons[i];
            const isExpanded = expandedLessonIndex === i;
            const isActive = c.isNext || c.inProgress;

            return (
              <View
                key={c.id}
                style={[
                  styles.lessonCard,
                  c.blocked && styles.lessonCardBlocked,
                  isActive && !c.blocked && styles.lessonCardActive,
                ]}
              >
                {/* Card Header - Always Visible */}
                <TouchableOpacity
                  style={styles.lessonCardHeader}
                  onPress={() => {
                    if (!c.blocked) {
                      setExpandedLessonIndex(isExpanded ? null : i);
                    }
                  }}
                  disabled={c.blocked}
                  activeOpacity={0.7}
                >
                  {/* Circle Indicator */}
                  <View
                    style={[
                      styles.lessonCircle,
                      c.isCompleted && styles.lessonCircleCompleted,
                      c.blocked && styles.lessonCircleBlocked,
                      isActive && !c.blocked && !c.isCompleted && styles.lessonCircleActive,
                    ]}
                  >
                    {c.isCompleted ? (
                      <Feather name='check' size={20} color='#fff' />
                    ) : (
                      <Text
                        style={[
                          styles.lessonCircleText,
                          c.blocked && styles.lessonCircleTextBlocked,
                          isActive && !c.blocked && styles.lessonCircleTextActive,
                        ]}
                      >
                        {c.orderNumber}
                      </Text>
                    )}
                  </View>

                  {/* Lesson Title */}
                  <Text
                    style={[
                      styles.lessonTitle,
                      c.blocked && styles.lessonTitleBlocked,
                    ]}
                    numberOfLines={1}
                  >
                    {lesson.title}
                  </Text>

                  {/* Expand/Collapse Icon */}
                  {!c.blocked && (
                    <Feather
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color='#666'
                    />
                  )}
                </TouchableOpacity>

                {/* Expanded Content */}
                {isExpanded && !c.blocked && (
                  <View style={styles.lessonCardExpanded}>
                    <Text style={styles.lessonDescription}>
                      {lesson.description || 'No description available.'}
                    </Text>

                    <TouchableOpacity
                      style={[
                        styles.lessonButton,
                        { backgroundColor: '#D8492C' },
                      ]}
                      onPress={() => {
                        router.push({
                          pathname:
                            '/(tabs)/Learn/modules/[moduleId]/[submoduleId]/lessons/[lessonId]' as any,
                          params: {
                            moduleId,
                            submoduleId,
                            lessonId: lesson._id,
                          },
                        });
                      }}
                    >
                      <Text style={styles.lessonButtonText}>
                        {c.isCompleted
                          ? 'Retake Lesson'
                          : c.inProgress
                            ? 'Continue Lesson'
                            : 'Start Lesson'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Footer spacing */}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F4F4F4',
  },
  container: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    minHeight: '100%',
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 10,
    marginBottom: 24,
    gap: 12,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
    marginTop: 4,
  },
  headerTitleContainer: {
    flex: 1,
    paddingRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    lineHeight: 24,
    marginBottom: 4,
  },
  lessonCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lessonCount: {
    fontSize: 14,
    color: '#666',
  },

  // Lesson Cards
  lessonsContainer: {
    gap: 12,
  },
  lessonCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  lessonCardBlocked: {
    opacity: 0.6,
  },
  lessonCardActive: {
    borderWidth: 2,
    borderColor: '#D8492C',
  },
  lessonCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  lessonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E5E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lessonCircleCompleted: {
    backgroundColor: '#D8492C',
  },
  lessonCircleBlocked: {
    backgroundColor: '#E5E5E5',
  },
  lessonCircleActive: {
    backgroundColor: '#D8492C',
  },
  lessonCircleText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  lessonCircleTextBlocked: {
    color: '#9CA3AF',
  },
  lessonCircleTextActive: {
    color: '#fff',
  },
  lessonTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  lessonTitleBlocked: {
    color: '#9CA3AF',
  },
  lessonCardExpanded: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  lessonDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginTop: 12,
    marginBottom: 16,
  },
  lessonButton: {
    backgroundColor: '#D8492C',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lessonButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Loading and Error States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
  },
  textBlocked: {
    color: '#BDBDBD',
  },
});
