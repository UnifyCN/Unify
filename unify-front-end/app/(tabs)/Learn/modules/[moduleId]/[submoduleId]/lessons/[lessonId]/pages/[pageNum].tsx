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
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useLesson } from '@/hooks/learn/useLesson';
import { useModule } from '@/hooks/learn/useModule';
import { useLessonQuizzes } from '@/hooks/useLessonQuizzes';
import DropdownAccordion from '@/components/learn/DropdownAccordion';
import { LessonPageContent } from '@/types/learn';

export default function LessonPageScreen() {
  const router = useRouter();
  const { moduleId, submoduleId, lessonId, pageNum } = useLocalSearchParams<{
    moduleId: string;
    submoduleId: string;
    lessonId: string;
    pageNum: string;
  }>();
  const [showExitModal, setShowExitModal] = useState(false);

  const currentPage = parseInt(pageNum || '1');
  const { data: lesson, isLoading: loadingLesson } = useLesson(lessonId || '');
  const { data: moduleData } = useModule(moduleId || '');
  const { data: quizzes, isLoading: quizzesLoading, error: quizzesError } = useLessonQuizzes(lessonId || '');

  // Debug logging
  console.log('Lesson ID:', lessonId);
  console.log('Quizzes data:', quizzes);
  console.log('Quizzes loading:', quizzesLoading);
  console.log('Quizzes error:', quizzesError);

  const currentPageData = lesson?.pages?.[currentPage - 1];
  const totalPages = lesson?.pages?.length || 0;

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

  const handleNext = () => {
    if (currentPage < totalPages) {
      // Go to next page
      router.push({
        pathname: '/(tabs)/Learn/modules/[moduleId]/[submoduleId]/lessons/[lessonId]/pages/[pageNum]' as any,
        params: { moduleId, submoduleId, lessonId, pageNum: (currentPage + 1).toString() },
      });
    } else {
      // Lesson completed, check if there are quizzes
      if (quizzes && quizzes.length > 0) {
        // Navigate to first quiz (sorted by order_number)
        const sortedQuizzes = quizzes.sort((a, b) => a.order_number - b.order_number);
        const firstQuiz = sortedQuizzes[0];
        router.push({
          pathname: '/(tabs)/Learn/modules/[moduleId]/[submoduleId]/lessons/[lessonId]/quizzes/[quizId]' as any,
          params: { moduleId, submoduleId, lessonId, quizId: firstQuiz.quiz_id },
        });
      } else {
        // No quizzes, go back to map
        router.push({
          pathname: '/(tabs)/Learn/modules/[moduleId]/[submoduleId]/map' as any,
          params: { moduleId, submoduleId },
        });
      }
    }
  };

  const renderContent = (content: LessonPageContent, index: number) => {
    switch (content.content_type) {
      case 'rich_text':
        return renderRichText(content.content, index);
      
      case 'bullet_points':
        return renderBulletPoints(content.content, index);
      
      case 'image':
        return (
          <View key={index} style={styles.imageContainer}>
            <Text style={styles.imagePlaceholder}>Image: {content.content?.alt || 'Image'}</Text>
          </View>
        );
      
      case 'dropdown':
        console.log('Dropdown content:', content.content);
        // Transform the content structure to match DropdownAccordion expected format
        const dropdownItems = content.content?.content?.map((item: any, itemIndex: number) => {
          console.log('Processing dropdown item:', item);
          
          // Render the content properly
          const renderDropdownContent = (contentArray: any[]) => {
            return contentArray.map((contentItem: any, contentIndex: number) => {
              if (contentItem.type === 'list') {
                return contentItem.items.map((listItem: any, listIndex: number) => {
                  // Handle nested array structure
                  const text = Array.isArray(listItem) 
                    ? listItem.map((nestedItem: any) => nestedItem.text || nestedItem).join(' ')
                    : listItem.text || listItem;
                  return `• ${text}`;
                }).join('\n');
              } else if (contentItem.type === 'text') {
                return Array.isArray(contentItem.content)
                  ? contentItem.content.map((textItem: any) => textItem.text || textItem).join('')
                  : contentItem.text || contentItem;
              }
              return contentItem.text || contentItem;
            }).join('\n\n');
          };
          
          return {
            id: `dropdown-${index}-${itemIndex}`,
            title: item.title || '',
            body: Array.isArray(item.content) 
              ? renderDropdownContent(item.content)
              : item.content || ''
          };
        }) || [];
        
        console.log('Transformed dropdown items:', dropdownItems);
        
        return (
          <View key={index} style={styles.dropdownContainer}>
            <DropdownAccordion items={dropdownItems} />
          </View>
        );
      
      case 'large_text_box':
        return (
          <View key={index} style={styles.inputContainer}>
            <TextInput
              style={[styles.textInput, styles.largeTextInput]}
              placeholder="Enter your answer here..."
              multiline
            />
          </View>
        );
      
      case 'mid_text_box':
        return (
          <View key={index} style={styles.inputContainer}>
            <TextInput
              style={[styles.textInput, styles.midTextInput]}
              placeholder="Enter your answer here..."
              multiline
            />
          </View>
        );
      
      case 'example_box':
        return (
          <View key={index} style={styles.exampleBox}>
            <Text style={styles.exampleBoxTitle}>Example</Text>
            {renderRichText(content.content, index)}
          </View>
        );
      
      case 'input':
        return (
          <View key={index} style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Enter your answer here..."
              multiline
            />
          </View>
        );
      
      default:
        console.log('Unknown content type:', content.content_type, content);
        return (
          <View key={index} style={styles.unknownContent}>
            <Text>Unknown content type: {content.content_type}</Text>
          </View>
        );
    }
  };

  const renderRichText = (content: any, index: number) => {
    if (!content?.sections) return null;

    return (
      <View key={index} style={styles.textContainer}>
        {content.sections.map((section: any, sectionIndex: number) => {
          // precise spacer detection:
          // - explicit spacer type => skip
          // - text section with no meaningful text in any nested field => skip
          const isExplicitSpacer = section.type === 'spacer';

          const isEmptyTextSection = (() => {
            if (section.type !== 'text') return false;
            const items = section.content;
            if (!items || items.length === 0) return true;

            // walk all content items and nested content to find any non-empty text
            for (const item of items) {
              if (item == null) continue;
              if (typeof item === 'string') {
                if (String(item).trim() !== '') return false;
                continue;
              }
              if (typeof item === 'object') {
                // direct text field
                if (typeof item.text === 'string' && String(item.text).trim() !== '') {
                  return false;
                }
                // nested content array
                if (Array.isArray(item.content)) {
                  for (const sub of item.content) {
                    if (sub && typeof sub.text === 'string' && String(sub.text).trim() !== '') {
                      return false;
                    }
                  }
                }
                // list-like structure: check items fields (if any)
                if (Array.isArray(item.items)) {
                  for (const it of item.items) {
                    if (typeof it === 'string') {
                      if (String(it).trim() !== '') return false;
                    } else if (it && typeof it.content === 'object') {
                      const subarr = it.content;
                      if (Array.isArray(subarr)) {
                        for (const sub of subarr) {
                          if (sub && typeof sub.text === 'string' && String(sub.text).trim() !== '') {
                            return false;
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
            // found no non-empty text
            return true;
          })();

          if (isExplicitSpacer || isEmptyTextSection) {
            return <View key={sectionIndex} style={styles.sectionSpacer} />;
          }

          return (
            <View key={sectionIndex} style={styles.section}>
              {section.type === 'text' && (
                <Text style={styles.textContent}>
                  {section.content?.map((textContent: any, textIndex: number) => (
                    <Text
                      key={textIndex}
                      style={[
                        textContent.bold && styles.boldText,
                        textContent.italic && styles.italicText,
                      ]}
                    >
                      {textContent.text}
                    </Text>
                  ))}
                </Text>
              )}
              
              {section.type === 'list' && (
                <View style={styles.listSection}>
                  {section.items?.map((item: any, itemIndex: number) => (
                    <View key={itemIndex} style={styles.listItem}>
                      <Text style={styles.bulletPoint}>•</Text>
                      <View style={styles.listItemContent}>
                        {typeof item === 'string' ? (
                          <Text style={styles.listText}>{item}</Text>
                        ) : (
                          <>
                            <Text style={styles.listText}>
                              {item.content?.map((textContent: any, textIndex: number) => (
                                <Text
                                  key={textIndex}
                                  style={[
                                    textContent.bold && styles.boldText,
                                    textContent.italic && styles.italicText,
                                  ]}
                                >
                                  {textContent.text}
                                </Text>
                              ))}
                            </Text>
                            {item.children && (
                              <View style={styles.nestedList}>
                                {item.children.map((child: any, childIndex: number) => (
                                  <View key={childIndex} style={styles.nestedItem}>
                                    {child.type === 'text' && (
                                      <Text style={styles.nestedText}>
                                        {child.content?.map((textContent: any, textIndex: number) => (
                                          <Text
                                            key={textIndex}
                                            style={[
                                              textContent.bold && styles.boldText,
                                              textContent.italic && styles.italicText,
                                            ]}
                                          >
                                            {textContent.text}
                                          </Text>
                                        ))}
                                      </Text>
                                    )}
                                    {child.type === 'list' && (
                                      <View style={styles.nestedListSection}>
                                        {child.items?.map((nestedItem: any, nestedIndex: number) => (
                                          <View key={nestedIndex} style={styles.nestedListItem}>
                                            <Text style={styles.nestedBulletPoint}>◦</Text>
                                            <View style={styles.nestedListItemContent}>
                                              <Text style={styles.nestedListText}>
                                                {nestedItem.content?.map((textContent: any, textIndex: number) => (
                                                  <Text
                                                    key={textIndex}
                                                    style={[
                                                      textContent.bold && styles.boldText,
                                                      textContent.italic && styles.italicText,
                                                    ]}
                                                  >
                                                    {textContent.text}
                                                  </Text>
                                                ))}
                                              </Text>
                                            </View>
                                          </View>
                                        ))}
                                      </View>
                                    )}
                                  </View>
                                ))}
                              </View>
                            )}
                          </>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              )}
              
              {section.type === 'image' && (
                <View style={styles.imageContainer}>
                  <Text style={styles.imagePlaceholder}>
                    {section.placeholder ? `Image: ${section.alt || 'Image'}` : 'Image'}
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </View>
    );
  };

  const renderBulletPoints = (content: any, index: number) => {
    return (
      <View key={index} style={styles.bulletPointsContainer}>
        {content?.items?.map((item: string, itemIndex: number) => (
          <View key={itemIndex} style={styles.bulletPointItem}>
            <Text style={styles.bulletPoint}>•</Text>
            <Text style={styles.bulletPointText}>{item}</Text>
          </View>
        ))}
      </View>
    );
  };

  if (loadingLesson) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loading}>
          <Text>Loading lesson...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!lesson || !currentPageData) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loading}>
          <Text>Error loading lesson page</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with X button and page indicator */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => setShowExitModal(true)}
            style={styles.closeBtn}
          >
            <Feather name='x' size={24} color='#000' />
          </TouchableOpacity>
          {totalPages > 1 && (
            <Text style={styles.pageIndicator}>
              {currentPage} of {totalPages}
            </Text>
          )}
        </View>

        {/* Page title */}
        <Text style={styles.pageTitle}>{currentPageData.title}</Text>

        {/* Page contents */}
        <View style={styles.content}>
          {currentPageData.contents
            .sort((a, b) => a.order_number - b.order_number)
            .map((content, index) => renderContent(content, index))}
        </View>

        {/* Next button */}
        <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
          <Text style={styles.nextBtnText}>
            {currentPage < totalPages 
              ? 'Next' 
              : quizzes && quizzes.length > 0 
                ? `Take Quiz (${quizzes.length} available)` 
                : 'Complete Lesson'
            }
          </Text>
        </TouchableOpacity>
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
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 12,
  },
  closeBtn: { padding: 4 },
  pageIndicator: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },

  pageTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000',
    marginBottom: 20,
    lineHeight: 38,
    textAlign: 'center',
    marginTop: 20,
  },

  content: {
    gap: 20,
    marginBottom: 30,
  },

  // Text content
  textContainer: {
    gap: 16,
  },
  section: {
    gap: 12,
  },
  textSection: {
    gap: 8,
  },
  textContent: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  boldText: {
    fontWeight: '700',
  },
  italicText: {
    fontStyle: 'italic',
  },

  // List content
  listSection: {
    gap: 12,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bulletPoint: {
    fontSize: 16,
    color: '#374151',
    marginTop: 2,
  },
  listItemContent: {
    flex: 1,
    gap: 4,
  },
  listText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },

  // Nested lists
  nestedList: {
    marginTop: 8,
    marginLeft: 16,
    gap: 8,
  },
  nestedItem: {
    gap: 8,
  },
  nestedTextSection: {
    gap: 4,
  },
  nestedText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
  nestedListSection: {
    gap: 6,
  },
  nestedListItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  nestedBulletPoint: {
    fontSize: 14,
    color: '#374151',
    marginTop: 2,
  },
  nestedListItemContent: {
    flex: 1,
  },
  nestedListText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },

  // Bullet points
  bulletPointsContainer: {
    gap: 8,
  },
  bulletPointItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bulletPointText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    flex: 1,
  },

  // Other content types
  imageContainer: {
    height: 200,
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  imagePlaceholder: {
    fontSize: 16,
    color: '#6B7280',
  },
  dropdownContainer: {
    marginVertical: 10,
  },
  inputContainer: {
    marginVertical: 10,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  largeTextInput: {
    minHeight: 150,
  },
  midTextInput: {
    minHeight: 120,
  },
  exampleBox: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    marginVertical: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  exampleBoxTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  unknownContent: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 12,
    marginVertical: 10,
  },

  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  nextBtn: {
    backgroundColor: '#575757',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },

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

  sectionSpacer: {
    height: 16,
  },
});
