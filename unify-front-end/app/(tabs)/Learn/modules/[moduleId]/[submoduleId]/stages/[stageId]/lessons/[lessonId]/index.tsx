import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useLesson } from '@/hooks/learn/useLesson';
import { useStageInfo } from '@/hooks/learn/useStageInfo';
import FlashcardsCarousel from '@/components/learn/FlashcardsCarousel';
import DropdownAccordion from '@/components/learn/DropdownAccordion';
import { useStageLessons } from '@/hooks/learn/useStageLessons';

const { width } = Dimensions.get('window');

export default function LessonScreen() {
  const router = useRouter();
  const { moduleId, submoduleId, stageId, lessonId } = useLocalSearchParams<{
    moduleId: string;
    submoduleId: string;
    stageId: string;
    lessonId: string;
  }>();
  const [showExitModal, setShowExitModal] = useState(false);

  const { data: lesson, isLoading, error } = useLesson(lessonId || '');
  const { data: lessons } = useStageLessons(stageId || '');
  const { data: stage } = useStageInfo(stageId || '');

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loading}>
          <Text>Loading lesson...</Text>
        </View>
      </SafeAreaView>
    );
  }
  if (error || !lesson || !stage) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loading}>
          <Text>Error loading lesson</Text>
        </View>
      </SafeAreaView>
    );
  }

  const ordered = (lessons ?? []).sort(
    (a: any, b: any) => a.order_num - b.order_num
  );
  const currentIndex = Math.max(
    0,
    ordered.findIndex((l: any) => l.id === lesson.id)
  );
  const prev = ordered[currentIndex - 1];
  const next = ordered[currentIndex + 1];

  // Calculate lesson progress (for now, based on whether there's a next lesson)
  // TODO: Track actual content completion within the lesson
  const progressPercent = 0; // Will update this later with actual completion tracking

  const handleSaveAndLeave = () => {
    setShowExitModal(false);
    // Navigate back to stage page
    router.push({
      pathname: '/(tabs)/Learn/modules/[moduleId]/[submoduleId]/map' as any,
      params: { moduleId, submoduleId, stageId },
    });
  };

  const handleContinue = () => {
    setShowExitModal(false);
  };

  const goTo = (target: any) => {
    if (!target) return;
    router.replace({
      pathname:
        '/(tabs)/Learn/modules/[moduleId]/[submoduleId]/stages/[stageId]/lessons/[lessonId]' as any,
      params: { moduleId, submoduleId, stageId, lessonId: target.id },
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with X button, progress bar, and lesson title */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => setShowExitModal(true)}
            style={styles.closeBtn}
          >
            <Feather name='x' size={24} color='#000' />
          </TouchableOpacity>

          {/* Lesson title */}
          <Text style={styles.lessonTitle}>
            Section {stage.order_num}: {stage.title}
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View
            style={[styles.progressBar, { width: `${progressPercent}%` }]}
          />
        </View>

        <Text style={styles.title}>{lesson.title}</Text>

        {/* Dynamic renderer only */}
        {lesson.type === 'flashcards' && (
          <FlashcardsCarousel
            items={lesson.contents.map((c: any, i: number) => ({
              id: `${lesson.id}-${i}`,
              front: c.content?.front ?? c.content?.term ?? 'Card',
              back: c.content?.back ?? c.content?.definition ?? 'Definition',
            }))}
          />
        )}
        {lesson.type === 'dropdown' && (
          <DropdownAccordion
            items={lesson.contents.map((c: any, i: number) => ({
              id: `${lesson.id}-${i}`,
              title: c.content?.title ?? `Item ${i + 1}`,
              body: c.content?.body ?? c.content?.text ?? '',
            }))}
          />
        )}

        <View style={styles.navRow}>
          <TouchableOpacity
            style={[styles.navBtn, !prev && styles.navBtnDisabled]}
            disabled={!prev}
            onPress={() => goTo(prev)}
          >
            <Text style={styles.navBtnText}>Back</Text>
          </TouchableOpacity>
          {next ? (
            <TouchableOpacity style={styles.navBtn} onPress={() => goTo(next)}>
              <Text style={styles.navBtnText}>Next</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.navBtn}
              onPress={() => router.back()}
            >
              <Text style={styles.navBtnText}>Done</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Exit Confirmation Modal */}
      <Modal
        visible={showExitModal}
        transparent
        animationType='fade'
        onRequestClose={() => setShowExitModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Take a break from this lesson?
            </Text>
            <Text style={styles.modalDesc}>
              No worries, your progress will be saved!{'\n'}
              You can pick up right where you left off.
            </Text>

            <TouchableOpacity
              style={styles.modalPrimaryBtn}
              onPress={handleSaveAndLeave}
            >
              <Text style={styles.modalPrimaryBtnText}>
                Save progress & leave
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalSecondaryBtn}
              onPress={handleContinue}
            >
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
    gap: 12,
  },
  closeBtn: { padding: 4 },
  lessonTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },

  // Progress Bar
  progressBarContainer: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginBottom: 24,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#000',
    borderRadius: 2,
  },

  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#000',
    marginBottom: 20,
    lineHeight: 30,
    textAlign: 'center',
  },

  // Navigation
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  navBtn: {
    flex: 1,
    backgroundColor: '#374151',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  navBtnDisabled: { backgroundColor: '#D1D5DB' },
  navBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalDesc: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
  },
  modalPrimaryBtn: {
    width: '100%',
    backgroundColor: '#4B5563',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  modalPrimaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalSecondaryBtn: {
    width: '100%',
    backgroundColor: '#E5E7EB',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalSecondaryBtnText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
});
