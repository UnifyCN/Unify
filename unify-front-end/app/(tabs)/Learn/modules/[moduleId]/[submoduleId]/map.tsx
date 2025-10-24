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
import { useLessonProgress } from '@/hooks/progress/useLessonProgress';
import { getLessonProgress } from '@/services/progress/progressService';
import { Feather } from '@expo/vector-icons';

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

  // Add state for selected lesson
  const [selectedLessonIndex, setSelectedLessonIndex] = useState<number | null>(
    null
  );

  // Progress tracking state
  const [lessonProgresses, setLessonProgresses] = useState<{[key: string]: any}>({});
  const [progressLoading, setProgressLoading] = useState(true);

  // Fetch lesson progress data
  useEffect(() => {
    if (submoduleData?.lessons) {
      const fetchLessonProgress = async () => {
        setProgressLoading(true);
        const progressData: {[key: string]: any} = {};
        
        for (const lesson of submoduleData.lessons) {
          try {
            const progress = await getLessonProgress(lesson._id);
            progressData[lesson._id] = progress;
          } catch (error) {
            console.error(`Error fetching progress for lesson ${lesson._id}:`, error);
            // Set default values if progress fetching fails
            progressData[lesson._id] = {
              is_completed: false,
              is_in_progress: false,
              progress_percent: 0
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
    return !progress?.is_completed && (progress?.is_in_progress || 
      submoduleData.lessons.indexOf(lesson) === 0 || 
      (submoduleData.lessons.indexOf(lesson) > 0 && 
       lessonProgresses[submoduleData.lessons[submoduleData.lessons.indexOf(lesson) - 1]._id]?.is_completed));
  });

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.replace({
            pathname: '/(tabs)/Learn/modules/[moduleId]/[submoduleId]',
            params:{moduleId, submoduleId},
          }

          )} style={styles.backButton}>
            <Feather name='arrow-left' size={24} color='#000' />
          </TouchableOpacity>
        </View>

        {/* Submodule Title Section, keeping this commented out incase design changes */}
        {/* <View style={styles.titleSection}>
          <Text style={styles.title}>{submoduleData.submodule_title}</Text>
          <Text style={styles.description}>{submoduleData.submodule_description}</Text>
        </View> */}

        {/* Focus Card: only show if a circle is selected */}
        {selectedLessonIndex !== null && (
          <View style={styles.focusCard}>
            <Text style={styles.focusTitle}>
              {/* Lesson {circles[selectedLessonIndex].orderNumber}:{' '} */}
              {submoduleData.lessons[selectedLessonIndex].title}
            </Text>
            <Text style={styles.focusDescription}>
              {submoduleData.lessons[selectedLessonIndex].description}
            </Text>
            
            {/* Progress Information */}
            {circles[selectedLessonIndex].isCompleted && (
              <Text style={styles.progressText}>✅ Completed</Text>
            )}
            {circles[selectedLessonIndex].inProgress && (
              <Text style={styles.progressText}>
                🔄 In Progress ({Math.round(circles[selectedLessonIndex].progressPercent)}%)
              </Text>
            )}
            {circles[selectedLessonIndex].isNext && (
              <Text style={styles.progressText}>🎯 Next Lesson</Text>
            )}
            {circles[selectedLessonIndex].blocked && (
              <Text style={styles.progressText}>🔒 Locked</Text>
            )}
            
            <TouchableOpacity
              style={[
                styles.focusCta,
                circles[selectedLessonIndex].blocked && styles.focusCtaDisabled
              ]}
              onPress={() => {
                router.push({
                  pathname:
                    '/(tabs)/Learn/modules/[moduleId]/[submoduleId]/lessons/[lessonId]' as any,
                  params: {
                    moduleId,
                    submoduleId,
                    lessonId: submoduleData.lessons[selectedLessonIndex]._id,
                  },
                });
              }}
              disabled={circles[selectedLessonIndex].blocked}
            >
              <Text
                style={[
                  styles.focusCtaText,
                  circles[selectedLessonIndex].blocked && styles.textBlocked,
                ]}
              >
                {circles[selectedLessonIndex].isCompleted ? 'Review Lesson' : 
                 circles[selectedLessonIndex].inProgress ? 'Continue Lesson' : 
                 circles[selectedLessonIndex].blocked ? 'Lesson Locked' : 'Start Lesson'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Zig-zag circles */}
        <View style={styles.zigzagContainer}>
          {circles.map((c, i) => {
            const leftSide = i % 2 === 0;
            const isActive = c.isNext || c.inProgress;
            return (
              <View key={c.id}>
                <View style={styles.zRow}>
                  <View
                    style={
                      leftSide ? styles.spacerGrowSmall : styles.spacerGrowLarge
                    }
                  />
                  <TouchableOpacity
                    activeOpacity={c.blocked ? 1 : 0.8}
                    style={[
                      styles.circleWrap,
                      c.isCompleted
                        ? styles.circleCompleted
                        : c.blocked
                          ? styles.circleBlocked
                          : isActive
                            ? styles.circleActive
                            : styles.circleNormal,
                    ]}
                    onPress={() => {
                      if (!c.blocked) setSelectedLessonIndex(i);
                    }}
                    disabled={c.blocked}
                  >
                    {c.isCompleted ? (
                      <View style={styles.circleCompletedInner}>
                        <Feather name='check' size={60} color='#fff' />
                      </View>
                    ) : c.blocked ? (
                      <View style={styles.circleBlockedInner}>
                        <Text style={styles.circleBlockedLabel}>Lesson</Text>
                        <Text style={styles.circleBlockedIndex}>{c.orderNumber}</Text>
                      </View>
                    ) : isActive ? (
                      <View style={styles.circleActiveInner}>
                        <Text style={styles.circleActiveLabel}>Lesson</Text>
                        <Text style={styles.circleActiveIndex}>{c.orderNumber}</Text>
                      </View>
                    ) : (
                      <View style={{ alignItems: 'center' }}>
                        <Text style={styles.circleLabelTop}>Lesson</Text>
                        <Text style={styles.circleIndex}>{c.orderNumber}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  <View
                    style={
                      leftSide ? styles.spacerGrowLarge : styles.spacerGrowSmall
                    }
                  />
                </View>
                {/* Label row centered under the circle */}
                <View style={styles.zRowLabelRow}>
                  <View
                    style={
                      leftSide ? styles.spacerGrowSmall : styles.spacerGrowLarge
                    }
                  />
                  <View style={styles.labelBox}>
                    <Text
                      style={[
                        styles.lessonTitleText,
                        c.blocked && styles.textBlocked,
                      ]}
                    >
                      {c.title?.substring(12) || c.title}
                    </Text>
                  </View>
                  <View
                    style={
                      leftSide ? styles.spacerGrowLarge : styles.spacerGrowSmall
                    }
                  />
                </View>
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
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },

  // Title Section
  titleSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    color: '#1A1A1A',
    marginBottom: 12,
    lineHeight: 38,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6B7280',
    lineHeight: 24,
    paddingHorizontal: 20,
    maxWidth: width - 40,
  },

  // Focus Card
  focusCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  focusTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  focusDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  focusCta: {
    backgroundColor: '#575757',
    alignSelf: 'stretch',
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 0,
    borderRadius: 12,
    marginTop: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  focusCtaText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  // Zig-zag circles
  zigzagContainer: {
    marginTop: 8,
  },
  zRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 9,
  },
  zRowLabel: {
    marginBottom: 8,
    paddingHorizontal: 15,
  },
  zRowLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 0,
    marginBottom: 10,
  },
  labelLeft: { alignItems: 'flex-start' },
  labelRight: { alignItems: 'flex-end' },
  spacer: { width: 0 },
  flexGrow: { flex: 1 },
  spacerGrowLarge: { flex: 1.5 },
  spacerGrowSmall: { flex: 0.5 },
  circleWrap: {
    width: 110,
    height: 110,
    borderRadius: 60,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderColor: '#E5E5E5',
  },
  circleNormal: {
    backgroundColor: '#fff',
    borderColor: '#E5E5E5',
  },
  // --- COMPLETED CIRCLE STYLES ---
  circleCompleted: {
    backgroundColor: '#fff',
    borderColor: '#A0A0A0',
  },
  circleCompletedInner: {
    width: 91,
    height: 91,
    borderRadius: 45.5,
    backgroundColor: '#A0A0A0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // --- END COMPLETED CIRCLE STYLES ---
  circleBlocked: {
    backgroundColor: '#fff',
    borderColor: '#dcdcdc',
  },
  circleBlockedInner: {
    width: 91,
    height: 91,
    borderRadius: 44,
    backgroundColor: '#E5E5E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleBlockedLabel: {
    fontSize: 16,
    color: '#9CA3AF',
    fontWeight: '500',
    marginBottom: -2,
  },
  circleBlockedIndex: {
    fontSize: 28,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  // --- ACTIVE CIRCLE STYLES ---
  circleActive: {
    backgroundColor: '#F8F9FA',
    borderColor: '#A0A0A0',
  },
  circleActiveInner: {
    width: 91,
    height: 91,
    borderRadius: 44,
    backgroundColor: '#A0A0A0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleActiveLabel: {
    fontSize: 16,
    color: '#222',
    fontWeight: '600',
    marginBottom: -2,
  },
  circleActiveIndex: {
    fontSize: 28,
    fontWeight: '700',
    color: '#222',
  },
  // --- END ACTIVE CIRCLE STYLES ---
  circleLabelTop: {
    fontSize: 16,
    color: '#222',
    fontWeight: '500',
    marginBottom: -2,
  },
  circleIndex: {
    fontSize: 28,
    fontWeight: '700',
    color: '#222',
  },
  lessonTitleText: {
    fontSize: 15,
    fontWeight: '700',
    marginHorizontal: 0,
    textAlign: 'center',
    color: '#222',
  },
  labelBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 0,
    minHeight: 40,
  },
  textBlocked: {
    color: '#BDBDBD',
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
  
  // Progress tracking styles
  progressText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginVertical: 8,
    fontWeight: '500',
  },
  focusCtaDisabled: {
    backgroundColor: '#E5E5E5',
    borderColor: '#D1D5DB',
  },
});
