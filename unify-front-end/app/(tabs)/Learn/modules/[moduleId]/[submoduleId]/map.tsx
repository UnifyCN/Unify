import React, { useState } from 'react';
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
import { useSubmoduleStages } from '@/hooks/learn/useSubmoduleStages';
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
  } = useSubmoduleStages(submoduleId || '');

  // Add state for selected stage
  const [selectedStageIndex, setSelectedStageIndex] = useState<number | null>(
    null
  );

  if (isLoading) {
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

  // Determine blocked/next/in-progress/completed
  const circles = submoduleData.stages.map(
    (stage: any, index: number, arr: any[]) => {
      const blocked = index > 0 && !arr[index - 1].is_completed;
      const isCompleted = !!stage.is_completed;
      // Next is first not completed and not blocked
      const nextIndex = arr.findIndex(
        (s: any, idx: number) =>
          !s.is_completed && (idx === 0 || arr[idx - 1].is_completed)
      );
      const isNext = index === nextIndex && !blocked;
      const inProgress = !isCompleted && stage.progress_percent > 0 && !blocked;
      return {
        id: stage.id,
        title: stage.title,
        index: index + 1,
        isCompleted,
        isNext,
        inProgress,
        blocked,
      };
    }
  );

  const nextStage =
    submoduleData.stages.find((stage: any) => !stage.is_completed) ||
    submoduleData.stages[0];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() =>
              router.replace({
                pathname: '/(tabs)/Learn/modules/[moduleId]/[submoduleId]',
                params: { moduleId, submoduleId },
              })
            }
            style={styles.backButton}
          >
            <Feather name='arrow-left' size={24} color='#000' />
          </TouchableOpacity>
        </View>

        {/* Submodule Title Section, keeping this commented out incase design changes */}
        {/* <View style={styles.titleSection}>
          <Text style={styles.title}>{submoduleData.submodule_title}</Text>
          <Text style={styles.description}>{submoduleData.submodule_description}</Text>
        </View> */}

        {/* Focus Card: only show if a circle is selected */}
        {selectedStageIndex !== null && (
          <View style={styles.focusCard}>
            <Text style={styles.focusTitle}>
              Lesson {selectedStageIndex + 1}:{' '}
              {submoduleData.stages[selectedStageIndex].title}
            </Text>
            {submoduleData.stages[selectedStageIndex].description ? (
              <Text style={styles.focusDescription} numberOfLines={3}>
                {submoduleData.stages[selectedStageIndex].description}
              </Text>
            ) : null}
            <TouchableOpacity
              style={styles.focusCta}
              onPress={() => {
                router.push({
                  pathname:
                    '/(tabs)/Learn/modules/[moduleId]/[submoduleId]/stages/[stageId]' as any,
                  params: {
                    moduleId,
                    submoduleId,
                    stageId: submoduleData.stages[selectedStageIndex].id,
                  },
                });
              }}
              disabled={circles[selectedStageIndex].blocked}
            >
              <Text
                style={[
                  styles.focusCtaText,
                  circles[selectedStageIndex].blocked && styles.textBlocked,
                ]}
              >
                {submoduleData.stages[selectedStageIndex].is_completed
                  ? 'Retake Lesson'
                  : submoduleData.stages[selectedStageIndex].progress_percent >
                      0
                    ? 'Resume Lesson'
                    : 'Start Lesson'}
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
                      if (!c.blocked) setSelectedStageIndex(i);
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
                        <Text style={styles.circleBlockedIndex}>{c.index}</Text>
                      </View>
                    ) : isActive ? (
                      <View style={styles.circleActiveInner}>
                        <Text style={styles.circleActiveLabel}>Lesson</Text>
                        <Text style={styles.circleActiveIndex}>{c.index}</Text>
                      </View>
                    ) : (
                      <View style={{ alignItems: 'center' }}>
                        <Text style={styles.circleLabelTop}>Lesson</Text>
                        <Text style={styles.circleIndex}>{c.index}</Text>
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
                        styles.stageTitleText,
                        c.blocked && styles.textBlocked,
                      ]}
                      numberOfLines={2}
                    >
                      {c.title}
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
    marginBottom: 12,
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
  stageTitleText: {
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
});
