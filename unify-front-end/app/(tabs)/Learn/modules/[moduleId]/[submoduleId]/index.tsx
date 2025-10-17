import React from 'react';
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
import { useSanityModule } from '@/hooks/sanity/useSanityModules';
import { Feather } from '@expo/vector-icons';

export default function SubmoduleIndex() {
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
  const { data: moduleData } = useSanityModule(moduleId || '');

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

  const nextLesson = submoduleData?.lessons?.[0]; // For now, just get the first lesson

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.replace({
            pathname: '/(tabs)/Learn/modules/[moduleId]',
            params:{moduleId},
            })} style={styles.backButton}>
            <Feather name='chevron-left' size={24} color='#000' />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              router.push({
                pathname:
                  '/(tabs)/Learn/modules/[moduleId]/[submoduleId]/map' as any,
                params: { moduleId, submoduleId },
              });
            }}
            style={styles.menuButton}
          >
            <Feather name='menu' size={20} color='#000' />
          </TouchableOpacity>
        </View>

        {/* Stage Header */}
        <Text style={styles.moduleLabel}>{moduleData?.title || 'Module'}</Text>
        <Text style={styles.title}>{`${submoduleData?.title}`}</Text>
        <View style={styles.mediaPlaceholder} />
        <Text style={styles.submoduleDesc}>
          {`By the end of this section, you will ${submoduleData?.description}`}
        </Text>

        {/* CTA to Intro Screen */}
        <TouchableOpacity
          style={styles.resumeButton}
          onPress={() => {
            router.push({
              pathname:
                '/(tabs)/Learn/modules/[moduleId]/[submoduleId]/intro/[pageNum]' as any,
              params: { moduleId, submoduleId, pageNum: '1' },
            });
          }}
        >
          <Text style={styles.resumeButtonText}>
            Start Submodule
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    paddingHorizontal: 30,
    paddingBottom: 40,
    minHeight: '100%',
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  menuButton: {
    padding: 8,
    marginRight: -8,
  },

  // Module Label
  moduleLabel: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '500',
  },

  // Title
  title: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    color: '#000',
    marginBottom: 32,
    lineHeight: 38,
    maxWidth: width * 0.75,
    alignSelf: 'center',
  },
  submoduleDesc: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginTop: 12,
    marginBottom: 16,
  },

  // Media Placeholder
  mediaPlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    marginBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  mediaPlaceholderText: {
    fontSize: 16,
    color: '#9CA3AF',
    fontWeight: '500',
  },

  // Objectives Section
  objectivesSection: {
    marginBottom: 40,
  },
  objectivesTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 20,
    lineHeight: 26,
  },
  objectivesList: {
    gap: 16,
  },
  objectiveItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  objectiveText: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    lineHeight: 24,
  },

  // Resume Button
  resumeButton: {
    backgroundColor: '#575757',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  resumeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  lessonTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
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
