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
import { Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';
import BookIcon from '@/assets/images/book_5.svg';

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

  // Add state for expanded lessons (using Set to allow multiple)
  const [expandedLessonIndices, setExpandedLessonIndices] = useState<
    Set<number>
  >(new Set());

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
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading submodule...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !submoduleData) {
    return (
      <SafeAreaView style={styles.safe}>
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
      {/* Back button and submodule title container */}
      <View style={styles.titleContainer}>
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
            {submoduleData?.title || 'Submodule'}
          </Text>
        </View>
      </View>

      <View style={styles.lessonCountWrapper}>
        <View style={styles.lessonCountContainer}>
          <BookIcon width={14} height={19} />
          <Text style={styles.lessonCount}>
            {submoduleData.lessons?.length || 0} Lessons
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Lesson Cards */}
        <View style={styles.lessonsContainer}>
          {circles.map((c, i) => {
            const lesson = submoduleData.lessons[i];
            const isExpanded = expandedLessonIndices.has(i);
            const isActive = c.isNext || c.inProgress;

            return (
              <View key={c.id} style={styles.lessonCardWrapper}>
                {/* Top Card - Header Only */}
                <TouchableOpacity
                  style={[
                    styles.lessonCardHeader,
                    c.blocked && styles.lessonCardBlocked,
                    isActive && !c.blocked && styles.lessonCardActive,
                  ]}
                  onPress={() => {
                    if (!c.blocked) {
                      setExpandedLessonIndices(prev => {
                        const newSet = new Set(prev);
                        if (isExpanded) {
                          newSet.delete(i);
                        } else {
                          newSet.add(i);
                        }
                        return newSet;
                      });
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
                      isActive &&
                        !c.blocked &&
                        !c.isCompleted &&
                        styles.lessonCircleActive,
                    ]}
                  >
                    {c.isCompleted ? (
                      <Feather name='check' size={20} color='#fff' />
                    ) : (
                      <Text
                        style={[
                          styles.lessonCircleText,
                          c.blocked && styles.lessonCircleTextBlocked,
                          isActive &&
                            !c.blocked &&
                            styles.lessonCircleTextActive,
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
                  >
                    {lesson.title.slice(12)}
                  </Text>

                  {/* Expand/Collapse Icon */}
                  {!c.blocked && (
                    <View style={styles.chevronContainer}>
                      <MaterialIcons
                        name={isExpanded ? 'arrow-drop-up' : 'arrow-drop-down'}
                        size={24}
                        color='#000'
                      />
                    </View>
                  )}
                </TouchableOpacity>

                {/* Bottom Card - Expanded Content */}
                {isExpanded && !c.blocked && (
                  <View style={styles.lessonCardContent}>
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
    paddingTop: 12,
    paddingBottom: 40,
    minHeight: '100%',
  },

  // Header
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 70,
    gap: 12,
    position: 'relative',
    borderTopWidth: 0,
    borderBottomWidth: 0,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitleContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 48,
    paddingRight: 48,
    paddingTop: 70,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#343434',
    lineHeight: 32,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  lessonCountWrapper: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lessonCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  lessonCount: {
    fontSize: 14,
    color: '#000',
    fontWeight: '600',
  },

  // Lesson Cards
  lessonsContainer: {
    gap: 12,
  },
  lessonCardWrapper: {
    gap: 6,
    alignSelf: 'stretch',
  },
  lessonCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 24,
    minHeight: 72,
    alignSelf: 'stretch',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  lessonCardBlocked: {
    opacity: 0.6,
  },
  lessonCardActive: {},
  lessonCircle: {
    width: 50,
    height: 50,
    borderRadius: 200,
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
    flexShrink: 1,
  },
  lessonTitleBlocked: {
    color: '#9CA3AF',
  },
  chevronContainer: {
    // Container for chevron alignment
  },
  lessonCardContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    marginTop: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  lessonDescription: {
    fontSize: 14,
    color: '#000',
    lineHeight: 20,
    marginBottom: 16,
    fontWeight: '400',
    marginLeft: 5,
  },
  lessonButton: {
    backgroundColor: '#D8492C',
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
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
