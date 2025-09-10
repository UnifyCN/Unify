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

        {/* Progress Card */}
        <View style={styles.progressCard}>
          <Text style={styles.progressText}>
            Progress: {submoduleData.completed_stages}/{submoduleData.total_stages} stages completed
          </Text>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${submoduleData.progress_percent}%` }]} />
            </View>
          </View>
        </View>

        {/* Stages Section */}
        <View style={styles.stagesContainer}>
          <Text style={styles.sectionTitle}>Learning Stages</Text>
          <Text style={styles.sectionSubtitle}>Complete each stage to progress through the module</Text>
          
          <View style={styles.stagesGrid}>
            {submoduleData.stages.map((stage, index) => (
              <TouchableOpacity
                key={stage.id}
                style={[
                  styles.stageBubble,
                  stage.is_completed && styles.completedBubble,
                  !stage.is_completed && stage.progress_percent > 0 && styles.inProgressBubble,
                ]}
                onPress={() => {
                  // For now, just show stage info - lesson navigation will be implemented later
                  console.log('Stage clicked:', stage.title);
                }}
              >
                <View style={styles.stageContent}>
                  <View style={[
                    styles.stageNumber,
                    stage.is_completed && styles.completedStageNumber,
                    !stage.is_completed && stage.progress_percent > 0 && styles.inProgressStageNumber,
                  ]}>
                    {stage.is_completed ? (
                      <Feather name='check' size={20} color='#fff' />
                    ) : (
                      <Text style={[
                        styles.stageNumberText,
                        stage.is_completed && styles.completedText,
                      ]}>
                        {index + 1}
                      </Text>
                    )}
                  </View>
                  
                  <Text style={[
                    styles.stageTitle,
                    stage.is_completed && styles.completedText,
                  ]}>
                    {stage.title}
                  </Text>
                  
                  <Text style={[
                    styles.stageDescription,
                    stage.is_completed && styles.completedDescription,
                  ]}>
                    {stage.completed_lessons}/{stage.lessons_count} lessons
                  </Text>
                  
                  {stage.progress_percent > 0 && !stage.is_completed && (
                    <View style={styles.stageProgressBar}>
                      <View style={[styles.stageProgressFill, { width: `${stage.progress_percent}%` }]} />
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Resume Button */}
        {nextStage && (
          <TouchableOpacity
            style={styles.resumeButton}
            onPress={() => {
              // For now, just show stage info - lesson navigation will be implemented later
              console.log('Resume stage:', nextStage.title);
            }}
          >
            <Text style={styles.resumeButtonText}>
              {nextStage.is_completed ? 'Review Stage' : 'Resume Stage'} {submoduleData.stages.indexOf(nextStage) + 1}
            </Text>
            <Feather name='arrow-right' size={20} color='#fff' style={styles.resumeIcon} />
          </TouchableOpacity>
        )}
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
  
  // Progress Card
  progressCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12
  },
  progressBarContainer: {
    width: '100%'
  },
  progressBar: { 
    height: 8, 
    backgroundColor: '#E5E7EB', 
    borderRadius: 4, 
    overflow: 'hidden' 
  },
  progressFill: { 
    height: '100%', 
    backgroundColor: '#10B981', 
    borderRadius: 4 
  },

  // Stages Section
  stagesContainer: { 
    marginTop: 8 
  },
  sectionTitle: { 
    fontSize: 24, 
    fontWeight: '700', 
    color: '#1A1A1A', 
    marginBottom: 8 
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
    lineHeight: 22
  },
  stagesGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 16,
    justifyContent: 'space-between',
  },
  
  // Stage Bubbles
  stageBubble: {
    width: '48%',
    aspectRatio: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1
  },
  completedBubble: {
    backgroundColor: '#F0FDF4',
    borderColor: '#10B981',
  },
  inProgressBubble: {
    backgroundColor: '#FFFBEB',
    borderColor: '#F59E0B',
  },
  
  stageContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    width: '100%'
  },
  
  stageNumber: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB'
  },
  completedStageNumber: {
    backgroundColor: '#10B981',
    borderColor: '#059669'
  },
  inProgressStageNumber: {
    backgroundColor: '#F59E0B',
    borderColor: '#D97706'
  },
  stageNumberText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
  },
  completedText: {
    color: '#fff',
  },
  
  stageTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 20
  },
  stageDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8
  },
  completedDescription: {
    color: '#059669'
  },
  
  // Stage Progress Bar
  stageProgressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 4
  },
  stageProgressFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 2
  },
  
  // Resume Button
  resumeButton: {
    marginTop: 32,
    backgroundColor: '#10B981',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4
  },
  resumeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8
  },
  resumeIcon: {
    marginLeft: 4
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
