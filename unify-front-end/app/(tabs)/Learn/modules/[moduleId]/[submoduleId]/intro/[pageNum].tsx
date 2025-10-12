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
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSubmoduleIntro, useSubmoduleIntroPages } from '@/hooks/learn/useSubmoduleIntro';
import { useSubmoduleLessons } from '@/hooks/learn/useSubmoduleLessons';
import { useModule } from '@/hooks/learn/useModule';
import { SubmoduleIntroSection } from '@/types/learn';

export default function SubmoduleIntroScreen() {
  const router = useRouter();
  const { moduleId, submoduleId, pageNum } = useLocalSearchParams<{
    moduleId: string;
    submoduleId: string;
    pageNum: string;
  }>();
  const [showExitModal, setShowExitModal] = useState(false);

  const currentPage = parseInt(pageNum || '1');
  const { data: introData, isLoading: loadingIntro } = useSubmoduleIntro(
    submoduleId || '',
    currentPage
  );
  const { data: totalPages } = useSubmoduleIntroPages(submoduleId || '');
  const { data: moduleData } = useModule(moduleId || '');
  const { data: submoduleLessons } = useSubmoduleLessons(submoduleId || '');

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
    if (currentPage < (totalPages || 1)) {
      router.push({
        pathname: '/(tabs)/Learn/modules/[moduleId]/[submoduleId]/intro/[pageNum]' as any,
        params: { moduleId, submoduleId, pageNum: (currentPage + 1).toString() },
      });
    } else {
      // Navigate to first lesson
      const firstLesson = submoduleLessons?.lessons?.[0];
      if (firstLesson) {
        router.push({
          pathname: '/(tabs)/Learn/modules/[moduleId]/[submoduleId]/lessons/[lessonId]' as any,
          params: { moduleId, submoduleId, lessonId: firstLesson.lesson_id },
        });
      } else {
        // Fallback to map if no lessons
        router.push({
          pathname: '/(tabs)/Learn/modules/[moduleId]/[submoduleId]/map' as any,
          params: { moduleId, submoduleId },
        });
      }
    }
  };

  const renderSection = (section: SubmoduleIntroSection, index: number) => {
    switch (section.type) {
      case 'text':
        return (
          <View key={index} style={styles.textSection}>
            {section.content?.map((textContent, textIndex) => (
              <Text
                key={textIndex}
                style={[
                  styles.textContent,
                  textContent.bold && styles.boldText,
                ]}
              >
                {textContent.text}
              </Text>
            ))}
          </View>
        );

      case 'list':
        return (
          <View key={index} style={styles.listSection}>
            {section.title && (
              <Text style={styles.listTitle}>{section.title}</Text>
            )}
            {section.items?.map((item, itemIndex) => {
              if (typeof item === 'string') {
                return (
                  <Text key={itemIndex} style={styles.listItem}>
                    • {item}
                  </Text>
                );
              } else {
                return (
                  <View key={itemIndex} style={styles.definitionItem}>
                    <Text style={styles.term}>{item.term}</Text>
                    <Text style={styles.definition}>{item.definition}</Text>
                  </View>
                );
              }
            })}
          </View>
        );

      case 'image':
        return (
          <View key={index} style={styles.imageSection}>
            {section.url ? (
              <Image source={{ uri: section.url }} style={styles.image} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.imagePlaceholderText}>
                  {section.alt || 'Image placeholder'}
                </Text>
              </View>
            )}
          </View>
        );

      case 'image_placeholder':
        return (
          <View key={index} style={styles.imageSection}>
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderText}>
                {section.alt || 'Image placeholder'}
              </Text>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  if (loadingIntro) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loading}>
          <Text>Loading intro...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!introData) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loading}>
          <Text>Error loading intro</Text>
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
          {totalPages && totalPages > 1 && (
            <Text style={styles.pageIndicator}>
              {currentPage} of {totalPages}
            </Text>
          )}
        </View>

        {/* Title */}
        <Text style={styles.title}>{introData.content.title}</Text>

        {/* Content sections */}
        <View style={styles.content}>
          {introData.content.sections.map((section, index) =>
            renderSection(section, index)
          )}
        </View>

        {/* Next button */}
        <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
          <Text style={styles.nextBtnText}>
            {currentPage < (totalPages || 1) ? 'Next' : 'Start Lessons'}
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

  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#000',
    marginBottom: 20,
    lineHeight: 30,
    textAlign: 'center',
  },

  content: {
    gap: 20,
    marginBottom: 30,
  },

  // Text sections
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

  // List sections
  listSection: {
    gap: 12,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  listItem: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginLeft: 8,
  },

  // Definition items
  definitionItem: {
    marginBottom: 12,
  },
  term: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  definition: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },

  // Image sections
  imageSection: {
    alignItems: 'center',
    marginVertical: 10,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
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
});
