import React, { useState, useEffect, useMemo } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import {
  useSanityPractice,
  useSanityPractices,
} from '@/hooks/sanity/useSanityPractices';
import { useSanityModule } from '@/hooks/sanity/useSanityModules';
import { useSanitySubmoduleWithLessons } from '@/hooks/sanity/useSanitySubmodules';
import RichTextRenderer from '@/components/sanity/RichTextRenderer';
import SubmoduleProgressBar from '@/components/learn/SubmoduleProgressBar';
import { usePracticeProgress } from '@/hooks/progress/usePracticeProgress';
import { useTranslation } from 'react-i18next';

export default function PracticeActivityPageScreen() {
  const { t } = useTranslation();
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
  const {
    data: practice,
    isLoading,
    error,
  } = useSanityPractice(practiceId || '');
  const { data: practices } = useSanityPractices(submoduleId || '');
  const { data: moduleData } = useSanityModule(moduleId || '');
  const { data: submoduleData } = useSanitySubmoduleWithLessons(
    submoduleId || ''
  );

  const sortedPractices = useMemo(
    () =>
      [...(practices || [])].sort(
        (a, b) => (a.order_number ?? 0) - (b.order_number ?? 0)
      ),
    [practices]
  );
  const currentPracticeIndex = useMemo(
    () => sortedPractices.findIndex(p => p._id === practiceId),
    [sortedPractices, practiceId]
  );
  const nextPractice =
    currentPracticeIndex >= 0 &&
    currentPracticeIndex < sortedPractices.length - 1
      ? sortedPractices[currentPracticeIndex + 1]
      : null;
  const prevPractice =
    currentPracticeIndex > 0 ? sortedPractices[currentPracticeIndex - 1] : null;

  const pages = React.useMemo(() => {
    const p = practice?.pages || [];
    return [...p].sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
  }, [practice?.pages]);

  const totalPages = pages.length;
  const currentPageData = pages[currentPage - 1];

  const [showExitModal, setShowExitModal] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [inputValues, setInputValues] = useState<{ [key: string]: string }>({});
  const [questionAnswers, setQuestionAnswers] = useState<{
    [key: string]: string | string[];
  }>({});

  const { updatePracticeProgress, completePractice } = usePracticeProgress();

  useFocusEffect(
    React.useCallback(() => {
      if (!practiceId || !practice) return;
      updatePracticeProgress(practiceId, currentPage);
    }, [practiceId, practice, currentPage, updatePracticeProgress])
  );

  useEffect(() => {
    setIsSubmitted(false);
    setInputValues({});
    setQuestionAnswers({});
  }, [currentPage]);

  const isSequential = sortedPractices.length > 1;
  const progress = {
    currentPage: isSequential ? currentPracticeIndex + 1 : currentPage,
    totalPages: isSequential ? sortedPractices.length : totalPages,
    progressPercentage: isSequential
      ? sortedPractices.length > 0
        ? ((currentPracticeIndex + 1) / sortedPractices.length) * 100
        : 0
      : totalPages > 0
        ? (currentPage / totalPages) * 100
        : 0,
  };

  const handleSaveAndLeave = () => {
    setShowExitModal(false);
    goToSubmoduleIndex();
  };

  const handleInputChange = (fieldKey: string, value: string) => {
    setInputValues(prev => ({ ...prev, [fieldKey]: value }));
  };

  const handleQuestionAnswer = (
    questionKey: string,
    answer: string | string[]
  ) => {
    setQuestionAnswers(prev => ({ ...prev, [questionKey]: answer }));
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
  };

  const handleNext = async () => {
    if (currentPage < totalPages) {
      const nextPage = currentPage + 1;
      await updatePracticeProgress(practiceId!, nextPage);
      router.push({
        pathname:
          '/(tabs)/Learn/modules/[moduleId]/[submoduleId]/practice/[practiceId]/activity/[pageNum]' as any,
        params: {
          moduleId,
          submoduleId,
          practiceId,
          pageNum: nextPage.toString(),
        },
      });
    } else {
      await completePractice(practiceId!);
      if (nextPractice) {
        router.replace({
          pathname:
            '/(tabs)/Learn/modules/[moduleId]/[submoduleId]/practice/[practiceId]' as any,
          params: { moduleId, submoduleId, practiceId: nextPractice._id },
        });
      } else {
        goToSubmoduleIndex();
      }
    }
  };

  const handleBack = async () => {
    if (currentPage > 1) {
      const prevPage = currentPage - 1;
      await updatePracticeProgress(practiceId!, prevPage);
      router.push({
        pathname:
          '/(tabs)/Learn/modules/[moduleId]/[submoduleId]/practice/[practiceId]/activity/[pageNum]' as any,
        params: {
          moduleId,
          submoduleId,
          practiceId,
          pageNum: prevPage.toString(),
        },
      });
    } else {
      if (prevPractice) {
        router.push({
          pathname:
            '/(tabs)/Learn/modules/[moduleId]/[submoduleId]/practice/[practiceId]' as any,
          params: { moduleId, submoduleId, practiceId: prevPractice._id },
        });
      } else {
        goToSubmoduleIndex();
      }
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loading}>
          <Text>{t('learn.lesson.loadingActivity')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !practice) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loading}>
          <Text>{t('learn.practice.failedToLoad')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentPageData) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loading}>
          <Text>{t('learn.practice.pageNotFound')}</Text>
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
        colorHex={moduleData?.colorTheme?.hex}
      />

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>{currentPageData.title}</Text>

        <View style={styles.instructionsContainer}>
          {(currentPageData.instructions || []).map(
            (block: any, index: number) => {
              const key = block._key || `block-${index}`;
              const markDefs = (currentPageData as any).instructionsMarkDefs;
              if (
                block._type === 'multiple_choice_single' ||
                block._type === 'multiple_choice_multiple'
              ) {
                const isMultiple = block._type === 'multiple_choice_multiple';
                const currentAnswer = questionAnswers[block._key];
                const isArrayAnswer = Array.isArray(currentAnswer);
                const selectedValues = isArrayAnswer
                  ? (currentAnswer as string[])
                  : currentAnswer
                    ? [currentAnswer as string]
                    : [];
                const handleOptionSelect = (optionValue: string) => {
                  if (isMultiple) {
                    const current =
                      (questionAnswers[block._key] as string[]) || [];
                    const newAnswer = current.includes(optionValue)
                      ? current.filter((v: string) => v !== optionValue)
                      : [...current, optionValue];
                    handleQuestionAnswer(block._key, newAnswer);
                  } else {
                    handleQuestionAnswer(block._key, optionValue);
                  }
                };
                return (
                  <View key={key} style={styles.activityQuestionContainer}>
                    <View style={styles.activityQuestionContent}>
                      <RichTextRenderer
                        blocks={block.question_text || []}
                        markDefs={markDefs}
                      />
                    </View>
                    <View style={styles.activityOptionsContainer}>
                      {(block.options || []).map((option: any) => {
                        const isSelected = isMultiple
                          ? selectedValues.includes(option.value)
                          : selectedValues[0] === option.value;
                        const isCorrect = option.is_correct;
                        const showFeedback = isSubmitted;
                        let optionStyle = styles.activityOptionButton;
                        let checkboxStyle = styles.activityCheckbox;
                        if (isSelected) {
                          optionStyle = styles.activityOptionButtonSelected;
                          checkboxStyle = styles.activityCheckboxSelected;
                        }
                        if (showFeedback) {
                          if (isCorrect) {
                            optionStyle = styles.activityOptionButtonCorrect;
                            checkboxStyle = styles.activityCheckboxCorrect;
                          } else if (isSelected && !isCorrect) {
                            optionStyle = styles.activityOptionButtonIncorrect;
                            checkboxStyle = styles.activityCheckboxIncorrect;
                          }
                        }
                        return (
                          <TouchableOpacity
                            key={option._key}
                            style={optionStyle}
                            onPress={() =>
                              !showFeedback && handleOptionSelect(option.value)
                            }
                            disabled={showFeedback}
                          >
                            <View style={styles.activityOptionRow}>
                              <View style={checkboxStyle}>
                                {isSelected && (
                                  <Text style={styles.activityCheckmark}>
                                    ✓
                                  </Text>
                                )}
                              </View>
                              <View style={styles.activityOptionContent}>
                                <RichTextRenderer
                                  blocks={option.text || []}
                                  markDefs={option.textMarkDefs}
                                  styles={{
                                    normal: {
                                      fontSize: 18,
                                      color: '#374151',
                                      lineHeight: 27,
                                      fontWeight: '400',
                                      marginBottom: 0,
                                      marginTop: 0,
                                    },
                                  }}
                                />
                              </View>
                            </View>
                            {showFeedback &&
                              isSelected &&
                              option.explanation && (
                                <View
                                  style={styles.activityExplanationContainer}
                                >
                                  <RichTextRenderer
                                    blocks={option.explanation}
                                    markDefs={option.explanationMarkDefs}
                                    styles={{
                                      normal: {
                                        fontSize: 18,
                                        color: '#6B7280',
                                        lineHeight: 27,
                                        fontStyle: 'italic',
                                        marginTop: 12,
                                        paddingTop: 12,
                                        borderTopWidth: 1,
                                        borderTopColor: '#E5E7EB',
                                      },
                                    }}
                                  />
                                </View>
                              )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                );
              }
              return (
                <RichTextRenderer
                  key={key}
                  blocks={[block]}
                  markDefs={markDefs}
                  inputValues={inputValues}
                  onInputChange={handleInputChange}
                  questionAnswers={questionAnswers}
                  onQuestionAnswer={handleQuestionAnswer}
                  showQuestionFeedback={isSubmitted}
                />
              );
            }
          )}
        </View>

        {currentPageData.answer_box && isSubmitted && (
          <View style={styles.answerBoxContainer}>
            {currentPageData.answer_box.title && (
              <Text style={styles.answerBoxTitle}>
                {currentPageData.answer_box.title}
              </Text>
            )}
            <RichTextRenderer
              blocks={currentPageData.answer_box.content || []}
              markDefs={currentPageData.answer_box.markDefs}
              styles={{
                normal: {
                  fontSize: 18,
                  lineHeight: 27,
                  fontWeight: '400',
                  color: '#3F3F3F',
                  marginBottom: 0,
                },
                bullet: {
                  fontSize: 18,
                  lineHeight: 27,
                  fontWeight: '400',
                  color: '#3F3F3F',
                  marginBottom: 0,
                },
                number: {
                  fontSize: 18,
                  lineHeight: 27,
                  fontWeight: '400',
                  color: '#3F3F3F',
                  marginBottom: 0,
                },
                strong: {
                  fontSize: 18,
                  lineHeight: 27,
                  fontWeight: '600',
                  color: '#3F3F3F',
                },
              }}
            />
          </View>
        )}
      </ScrollView>

      <View style={styles.navigationContainer}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
          <Text style={styles.backBtnText}>{t('common.back')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.nextBtn,
            { backgroundColor: moduleData?.colorTheme?.hex || '#575757' },
          ]}
          onPress={isSubmitted ? handleNext : handleSubmit}
        >
          <Text style={styles.nextBtnText}>
            {!isSubmitted
              ? t('common.submit')
              : currentPage < totalPages
                ? t('common.next')
                : t('learn.pathwayCard.done')}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showExitModal}
        transparent
        animationType='fade'
        onRequestClose={() => setShowExitModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {t('learn.practice.exitTitle')}
            </Text>
            <Text style={styles.modalDesc}>
              {t('learn.practice.exitBody')}
            </Text>
            <TouchableOpacity
              style={styles.modalPrimaryBtn}
              onPress={handleSaveAndLeave}
            >
              <Text style={styles.modalPrimaryBtnText}>
                {t('learn.lesson.exitSave')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalSecondaryBtn}
              onPress={() => setShowExitModal(false)}
            >
              <Text style={styles.modalSecondaryBtnText}>
                {t('learn.lesson.exitActivityContinue')}
              </Text>
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
  // Activity MCQ (single + multi) – same alignment as practice quiz
  activityQuestionContainer: {
    marginVertical: 20,
    gap: 15,
  },
  activityQuestionContent: {
    paddingTop: 12,
    marginBottom: 24,
    alignItems: 'center',
  },
  activityOptionsContainer: {
    gap: 17,
  },
  activityOptionButton: {
    borderWidth: 1,
    borderColor: '#DCDCDC',
    borderRadius: 8,
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  activityOptionButtonSelected: {
    borderWidth: 1,
    borderColor: 'black',
    borderRadius: 8,
    paddingVertical: 20,
    paddingHorizontal: 24,
    backgroundColor: '#F3F4F6',
  },
  activityOptionButtonCorrect: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderColor: '#10B981',
    backgroundColor: '#F3F4F6',
  },
  activityOptionButtonIncorrect: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderColor: '#EF4444',
    backgroundColor: '#F3F4F6',
  },
  activityOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activityCheckbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 4,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityCheckboxSelected: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: 'black',
    borderRadius: 4,
    backgroundColor: 'black',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityCheckboxCorrect: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: 4,
    borderColor: '#10B981',
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityCheckboxIncorrect: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: 4,
    borderColor: '#EF4444',
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityCheckmark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  activityOptionContent: {
    flex: 1,
  },
  activityExplanationContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
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
    backgroundColor: '#575757',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  modalPrimaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  modalSecondaryBtn: {
    width: '100%',
    backgroundColor: '#E5E7EB',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalSecondaryBtnText: { color: '#000', fontSize: 16, fontWeight: '600' },
});
