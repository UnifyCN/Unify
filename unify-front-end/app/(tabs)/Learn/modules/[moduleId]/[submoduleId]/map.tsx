import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Dimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSubmoduleStages } from '@/hooks/learn/useSubmoduleStages';
import { Feather } from '@expo/vector-icons';

export default function SubmoduleMap() {
  const router = useRouter();
  const { moduleId, submoduleId } = useLocalSearchParams<{ moduleId: string; submoduleId: string }>();
  
  const { data: submoduleData, isLoading, error } = useSubmoduleStages(submoduleId || '');

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
          <Text style={styles.errorText}>Error loading submodule: {error?.message || 'Unknown error'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const nextStage = submoduleData.stages.find((stage: any) => !stage.is_completed) || submoduleData.stages[0];
  const circles = submoduleData.stages.map((stage: any, index: number) => ({
    id: stage.id,
    title: stage.title,
    index: index + 1,
    isCompleted: !!stage.is_completed,
    inProgress: !stage.is_completed && stage.progress_percent > 0,
  }));

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Feather name='arrow-left' size={24} color='#000' />
          </TouchableOpacity>
        </View>

        {/* Submodule Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>{submoduleData.submodule_title}</Text>
          <Text style={styles.description}>{submoduleData.submodule_description}</Text>
        </View>

        {/* Optional: focus card for current/next lesson */}
        {nextStage && (
          <View style={styles.focusCard}>
            <Text style={styles.focusTitle}>Lesson {submoduleData.stages.indexOf(nextStage) + 1}: {nextStage.title}</Text>
            {nextStage.description ? (
              <Text style={styles.focusDescription} numberOfLines={3}>{nextStage.description}</Text>
            ) : null}
            <TouchableOpacity
              style={styles.focusCta}
              onPress={() => {
                router.push({
                  pathname: '/(tabs)/Learn/modules/[moduleId]/[submoduleId]/stages/[stageId]' as any,
                  params: { moduleId, submoduleId, stageId: nextStage.id },
                });
              }}
            >
              <Text style={styles.focusCtaText}>{nextStage.is_completed ? 'Retake Lesson' : nextStage.progress_percent > 0 ? 'Resume Lesson' : 'Start Lesson'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Zig-zag circles */}
        <View style={styles.zigzagContainer}>
          {circles.map((c, i) => {
            const leftSide = i % 2 === 0;
            return (
              <View key={c.id}>
                <View style={styles.zRow}>
                  <View style={leftSide ? styles.spacerGrowSmall : styles.spacerGrowLarge} />
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={[styles.circleWrap, c.isCompleted ? styles.circleCompleted : c.inProgress ? styles.circleInProgress : styles.circleDefault]}
                    onPress={() => {
                      router.push({
                        pathname: '/(tabs)/Learn/modules/[moduleId]/[submoduleId]/stages/[stageId]' as any,
                        params: { moduleId, submoduleId, stageId: c.id },
                      });
                    }}
                  >
                    {c.isCompleted ? (
                      <Feather name='check' size={32} color='#fff' />
                    ) : (
                      <View style={{ alignItems: 'center' }}>
                        <Text style={styles.circleLabelTop}>Lesson</Text>
                        <Text style={styles.circleIndex}>{c.index}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  <View style={leftSide ? styles.spacerGrowLarge : styles.spacerGrowSmall} />
                </View>
                {/* Label row centered under the circle */}
                <View style={styles.zRowLabelRow}>
                  <View style={leftSide ? styles.spacerGrowSmall : styles.spacerGrowLarge} />
                  <View style={styles.labelBox}>
                    <Text
                      style={[
                        styles.stageTitleText,
                        c.isCompleted ? styles.titleCompleted : c.inProgress ? styles.titleInProgress : styles.titleDefault,
                      ]}
                      numberOfLines={2}
                    >
                      {c.title}
                    </Text>
                  </View>
                  <View style={leftSide ? styles.spacerGrowLarge : styles.spacerGrowSmall} />
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
    backgroundColor: '#F8F9FA' 
  },
  container: { 
    paddingHorizontal: 20, 
    paddingBottom: 40,
    minHeight: '100%'
  },
  
  // Header
  headerRow: { 
    flexDirection: 'row', 
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20
  },
  backButton: { 
    padding: 8,
    marginLeft: -8
  },

  // Title Section
  titleSection: {
    alignItems: 'center',
    marginBottom: 24
  },
  title: { 
    fontSize: 32, 
    fontWeight: '700', 
    textAlign: 'center', 
    color: '#1A1A1A',
    marginBottom: 12,
    lineHeight: 38
  },
  description: { 
    fontSize: 16, 
    textAlign: 'center', 
    color: '#6B7280', 
    lineHeight: 24,
    paddingHorizontal: 20,
    maxWidth: width - 40
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
    backgroundColor: '#4B5563',
    alignSelf: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
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
    marginVertical: 13,
  },
  zRowLabel: {
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  zRowLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  marginTop: 0,
  marginBottom: 22,
  },
  labelLeft: { alignItems: 'flex-start' },
  labelRight: { alignItems: 'flex-end' },
  spacer: { width: 0 },
  flexGrow: { flex: 1 },
  spacerGrowLarge: { flex: 1.5 },
  spacerGrowSmall: { flex: 0.5 },
  circleWrap: {
  width: 100,
  height: 100,
  borderRadius: 50,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB',
  },
  labelBox: {
  width: 100,
    alignItems: 'center',
  },
  circleDefault: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  circleInProgress: {
    backgroundColor: '#FFFBEB',
    borderColor: '#F59E0B',
  },
  circleCompleted: {
    backgroundColor: '#10B981',
    borderColor: '#059669',
  },
  circleLabelTop: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: -4,
  },
  circleIndex: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  stageTitleText: {
  fontSize: 15,
    fontWeight: '700',
    marginHorizontal: 0,
    textAlign: 'center',
  },
  titleDefault: { color: '#1F2937' },
  titleInProgress: { color: '#92400E' },
  titleCompleted: { color: '#065F46' },
  
  // (old resume button styles removed)
  
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
