import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Dimensions, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useStageInfo } from '@/hooks/learn/useStageInfo';
import { useStageLessons } from '@/hooks/learn/useStageLessons';
import { useModule } from '@/hooks/learn/useModule';
import FlashcardsCarousel from '@/components/learn/FlashcardsCarousel';
import DropdownAccordion from '@/components/learn/DropdownAccordion';

export default function StageScreen() {
  const router = useRouter();
  const { moduleId, submoduleId, stageId } = useLocalSearchParams<{ moduleId: string; submoduleId: string; stageId: string }>();
  const [showExitModal, setShowExitModal] = useState(false);

  const { data: stage, isLoading: loadingStage, error: stageError } = useStageInfo(stageId || '');
  const { data: lessons, isLoading: loadingLessons } = useStageLessons(stageId || '');
  const { data: moduleData } = useModule(moduleId || '');

  // Calculate progress based on completed lessons
  const completedLessons = lessons?.filter((l: any) => l.is_completed)?.length || 0;
  const totalLessons = lessons?.length || 0;
  const progressPercent = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

  const handleSaveAndLeave = () => {
    setShowExitModal(false);
    // Navigate to submodule map
    router.push({
      pathname: '/(tabs)/Learn/modules/[moduleId]/[submoduleId]/map' as any,
      params: { moduleId, submoduleId },
    });
  };

  const handleContinue = () => {
    setShowExitModal(false);
  };

  if (loadingStage) {
    return (
      <SafeAreaView style={styles.safe}><View style={styles.loading}><Text>Loading stage...</Text></View></SafeAreaView>
    );
  }

  if (stageError || !stage) {
    return (
      <SafeAreaView style={styles.safe}><View style={styles.loading}><Text>Error loading stage</Text></View></SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header with X button, progress bar, and stage title */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowExitModal(true)} style={styles.closeBtn}>
            <Feather name='x' size={24} color='#000' />
          </TouchableOpacity>
          
          {/* Stage title */}
          <Text style={styles.stageTitle}>Section {stage.order_num}: {stage.title}</Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${progressPercent}%` }]} />
        </View>

        {/* Welcome message */}
        <Text style={styles.title}>
          Welcome to Stage {stage.order_num} of Your {moduleData?.title || 'Finance'} Journey!
        </Text>
        
        <View style={styles.media} />
        
        {/* Stage description */}
        <Text style={styles.desc}>{stage.description}</Text>
        

        {!loadingLessons && lessons && lessons.length > 0 && (
          <View style={{ gap: 20 }}>
            
            {/* Next button to go to first lesson */}
            <TouchableOpacity
              style={styles.nextBtn}
              onPress={() => {
                const first = lessons[0];
                if (!first) return;
                 router.push({
                   pathname: '/(tabs)/Learn/modules/[moduleId]/[submoduleId]/stages/[stageId]/lessons/[lessonId]' as any,
                   params: { moduleId, submoduleId, stageId: stage.id, lessonId: first.id },
                 });
              }}
            >
              <Text style={styles.nextBtnText}>Next</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Exit Confirmation Modal */}
      <Modal
        visible={showExitModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowExitModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Take a break from this lesson?</Text>
            <Text style={styles.modalDesc}>
              No worries, your progress will be saved!{'\n'}
              You can pick up right where you left off.
            </Text>
            
            <TouchableOpacity style={styles.modalPrimaryBtn} onPress={handleSaveAndLeave}>
              <Text style={styles.modalPrimaryBtnText}>Save progress & leave</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.modalSecondaryBtn} onPress={handleContinue}>
              <Text style={styles.modalSecondaryBtnText}>Continue Lesson</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { paddingHorizontal: 20, paddingBottom: 40 },
  
  // Header
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 10, 
    marginBottom: 12,
    gap: 12
  },
  closeBtn: { padding: 4 },
  stageTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#000'
  },
  
  // Progress Bar
  progressBarContainer: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginBottom: 24,
    overflow: 'hidden'
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#000',
    borderRadius: 2
  },
  
  title: { 
    fontSize: 30, 
    fontWeight: '700', 
    color: '#000', 
    marginBottom: 20, 
    lineHeight: 30,
    textAlign: 'center'
  },
  media: { 
    height: 160, 
    borderRadius: 12,   
    backgroundColor: '#E5E7EB', 
    marginBottom: 16 
  },
  desc: { 
    fontSize: 14, 
    color: '#6B7280', 
    lineHeight: 20, 
    marginBottom: 16 
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8
  },
  bulletList: {
    marginBottom: 20,
    gap: 4
  },
  bulletItem: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20
  },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  nextBtn: { 
    marginTop: 8, 
    backgroundColor: '#575757', 
    paddingVertical: 14, 
    borderRadius: 12, 
    alignItems: 'center' 
  },
  nextBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center'
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
    textAlign: 'center'
  },
  modalDesc: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24
  },
  modalPrimaryBtn: {
    width: '100%',
    backgroundColor: '#4B5563',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12
  },
  modalPrimaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  modalSecondaryBtn: {
    width: '100%',
    backgroundColor: '#E5E7EB',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center'
  },
  modalSecondaryBtnText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600'
  },
});


