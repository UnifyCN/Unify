import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSanityPractice } from '@/hooks/sanity/useSanityPractices';
import { useSanityModule } from '@/hooks/sanity/useSanityModules';
import { useSanitySubmoduleWithLessons } from '@/hooks/sanity/useSanitySubmodules';
import RichTextRenderer from '@/components/sanity/RichTextRenderer';
import SubmoduleProgressBar from '@/components/learn/SubmoduleProgressBar';

export default function PracticeActivityPageScreen() {
  const router = useRouter();
  const { moduleId, submoduleId, practiceId, pageNum } = useLocalSearchParams<{
    moduleId: string;
    submoduleId: string;
    practiceId: string;
    pageNum: string;
  }>();

  const goToSubmoduleIndex = () => {
    router.push({
      pathname: '/(tabs)/Learn/modules/[moduleId]/[submoduleId]' as any,
      params: { moduleId: moduleId!, submoduleId: submoduleId! },
    });
  };

  const currentPage = parseInt(pageNum || '1');
  const { data: practice, isLoading, error } = useSanityPractice(practiceId || '');
  const { data: moduleData } = useSanityModule(moduleId || '');
  const { data: submoduleData } = useSanitySubmoduleWithLessons(submoduleId || '');

  const pages = React.useMemo(() => {
    const p = practice?.pages || [];
    return [...p].sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
  }, [practice?.pages]);

  const totalPages = pages.length;
  const currentPageData = pages[currentPage - 1];

  const [showExitModal, setShowExitModal] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [inputValues, setInputValues] = useState<{ [key: string]: string }>({});
  const [questionAnswers, setQuestionAnswers] = useState<{ [key: string]: string | string[] }>({});

  useEffect(() => {
    setIsSubmitted(false);
    setInputValues({});
    setQuestionAnswers({});
  }, [currentPage]);

  const progress = {
    currentPage,
    totalPages,
    progressPercentage: totalPages > 0 ? (currentPage / totalPages) * 100 : 0,
  };

  const handleSaveAndLeave = () => {
    setShowExitModal(false);
    goToSubmoduleIndex();
  };

  const handleInputChange = (fieldKey: string, value: string) => {
    setInputValues(prev => ({ ...prev, [fieldKey]: value }));
  };

  const handleQuestionAnswer = (questionKey: string, answer: string | string[]) => {
    setQuestionAnswers(prev => ({ ...prev, [questionKey]: answer }));
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      router.push({
        pathname:
          '/(tabs)/Learn/modules/[moduleId]/[submoduleId]/practice/[practiceId]/activity/[pageNum]' as any,
        params: { moduleId, submoduleId, practiceId, pageNum: (currentPage + 1).toString() },
      });
    } else {
      goToPracticeList();
    }
  };

  const handleBack = () => {
    if (currentPage > 1) {
      router.push({
        pathname:
          '/(tabs)/Learn/modules/[moduleId]/[submoduleId]/practice/[practiceId]/activity/[pageNum]' as any,
        params: { moduleId, submoduleId, practiceId, pageNum: (currentPage - 1).toString() },
      });
    } else {
      goToPracticeList();
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loading}>
          <Text>Loading activity...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !practice) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loading}>
          <Text>Error loading practice</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentPageData) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loading}>
          <Text>Page not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <SubmoduleProgressBar
        currentProgress={progress.currentPage}
        totalPages={progress.totalPages}
        submoduleTitle={practice.title || submoduleData?.title || 'Practice'}
        submoduleOrder={submoduleData?.order ?? 1}
        onClose={() => setShowExitModal(true)}
      />

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>{currentPageData.title}</Text>

        <View style={styles.instructionsContainer}>
          <RichTextRenderer
            blocks={currentPageData.instructions || []}
            markDefs={(currentPageData as any).instructionsMarkDefs}
            inputValues={inputValues}
            onInputChange={handleInputChange}
            questionAnswers={questionAnswers}
            onQuestionAnswer={handleQuestionAnswer}
            showQuestionFeedback={isSubmitted}
          />
        </View>

        {currentPageData.answer_box && isSubmitted && (
          <View style={styles.answerBoxContainer}>
            {currentPageData.answer_box.title && (
              <Text style={styles.answerBoxTitle}>{currentPageData.answer_box.title}</Text>
            )}
            <RichTextRenderer
              blocks={currentPageData.answer_box.content || []}
              markDefs={currentPageData.answer_box.markDefs}
              styles={{
                normal: { fontSize: 14, lineHeight: 20, fontWeight: '400', color: '#3F3F3F', marginBottom: 0 },
                bullet: { fontSize: 14, lineHeight: 20, fontWeight: '400', color: '#3F3F3F', marginBottom: 0 },
                number: { fontSize: 14, lineHeight: 20, fontWeight: '400', color: '#3F3F3F', marginBottom: 0 },
                strong: { fontSize: 14, lineHeight: 20, fontWeight: '600', color: '#3F3F3F' },
              }}
            />
          </View>
        )}
      </ScrollView>

      <View style={styles.navigationContainer}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.nextBtn, { backgroundColor: moduleData?.colorTheme?.hex || '#575757' }]}
          onPress={isSubmitted ? handleNext : handleSubmit}
        >
          <Text style={styles.nextBtnText}>
            {!isSubmitted ? 'Submit' : currentPage < totalPages ? 'Next' : 'Done'}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showExitModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowExitModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Take a break from this activity?</Text>
            <Text style={styles.modalDesc}>
              Your progress will be saved. You can resume from the section page later.
            </Text>
            <TouchableOpacity style={styles.modalPrimaryBtn} onPress={handleSaveAndLeave}>
              <Text style={styles.modalPrimaryBtnText}>Save progress & leave</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalSecondaryBtn} onPress={() => setShowExitModal(false)}>
              <Text style={styles.modalSecondaryBtnText}>Continue Activity</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { paddingHorizontal: 23, paddingBottom: 100 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  pageTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000',
    marginBottom: 20,
    lineHeight: 38,
    textAlign: 'center',
    marginTop: 20,
  },
  instructionsContainer: { marginBottom: 15 },
  answerBoxContainer: {
    backgroundColor: 'transparent',
    borderLeftWidth: 5,
    borderLeftColor: '#3F3F3F',
    paddingLeft: 15,
    paddingRight: 0,
    paddingVertical: 0,
    alignSelf: 'center',
    maxWidth: '100%',
    minHeight: 30,
    marginTop: 0,
    marginBottom: 30,
  },
  answerBoxTitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    color: '#3F3F3F',
    marginBottom: 10,
  },
  navigationContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 23,
    paddingVertical: 20,
    paddingBottom: 15,
    backgroundColor: '#fff',
    gap: 12,
  },
  backBtn: {
    backgroundColor: '#E5E7EB',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
  },
  backBtnText: { color: '#374151', fontSize: 16, fontWeight: '600' },
  nextBtn: {
    backgroundColor: '#575757',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
  },
  nextBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
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
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#000', marginBottom: 12, textAlign: 'center' },
  modalDesc: { fontSize: 14, color: '#6B7280', lineHeight: 20, textAlign: 'center', marginBottom: 24 },
  modalPrimaryBtn: { width: '100%', backgroundColor: '#575757', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  modalPrimaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  modalSecondaryBtn: { width: '100%', backgroundColor: '#E5E7EB', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  modalSecondaryBtnText: { color: '#000', fontSize: 16, fontWeight: '600' },
});
