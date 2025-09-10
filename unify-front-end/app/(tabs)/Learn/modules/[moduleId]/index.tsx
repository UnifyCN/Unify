import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Dimensions } from 'react-native';
import { useRouter, useLocalSearchParams, Link } from 'expo-router';
import { useModule } from '@/hooks/learn/useModule';
import { Feather } from '@expo/vector-icons';

export default function ModuleIndex() {
  const router = useRouter();
  const { moduleId } = useLocalSearchParams<{ moduleId: string }>();
  
  const { data: moduleData, isLoading, error } = useModule(moduleId || '');

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading module...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !moduleData) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Error loading module: {error?.message || 'Unknown error'}</Text>
          <Link href='/(tabs)/Learn'>Go back to Learn</Link>
        </View>
      </SafeAreaView>
    );
  }

  const displaySubmodules = moduleData.submodules.map((submodule, i) => ({
    id: submodule.id,
    title: submodule.title,
    moduleNumber: i + 1,
    stages: submodule.total_stages,
    progress: submodule.progress_percent / 100,
    status: submodule.is_completed
      ? 'completed'
      : submodule.progress_percent > 0
      ? 'in-progress'
      : 'locked',
  }));

  const completedCount = moduleData.completed_submodules;
  const totalModules = moduleData.total_submodules;

  // Get module icon based on title
  const getModuleIcon = (title: string) => {
    if (title.toLowerCase().includes('banking') || title.toLowerCase().includes('finance')) {
      return '🏦';
    } else if (title.toLowerCase().includes('investing')) {
      return '📈';
    } else if (title.toLowerCase().includes('housing') || title.toLowerCase().includes('renting')) {
      return '🏠';
    } else if (title.toLowerCase().includes('employment') || title.toLowerCase().includes('job')) {
      return '💼';
    }
    return '📚';
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Feather name='arrow-left' size={24} color='#000' />
          </TouchableOpacity>
        </View>

        {/* Module Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>{moduleData.title}</Text>
          <Text style={styles.description}>{moduleData.description}</Text>
        </View>

        {/* Progress Card */}
        <View style={styles.progressCard}>
          <Text style={styles.progressText}>
            Progress: {completedCount}/{totalModules} modules completed
          </Text>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${moduleData.progress_percent}%` }]} />
            </View>
          </View>
        </View>

        {/* Learning Pathway */}
        <View style={styles.pathwayContainer}>          
          {displaySubmodules.map((m, i) => (
            <View key={m.id} style={styles.pathwayItem}>
              {/* Module Card */}
              <TouchableOpacity
                style={[
                  styles.moduleCard,
                  m.status === 'locked' && styles.lockedCard,
                  m.status === 'completed' && styles.completedCard,
                ]}
                onPress={() => {
                  if (m.status === 'locked') return;
                  router.push({
                    pathname: '/(tabs)/Learn/modules/[moduleId]/[submoduleId]' as any,
                    params: { moduleId, submoduleId: m.id },
                  });
                }}
                disabled={m.status === 'locked'}
              >
                <View style={styles.moduleContent}>
                  <Text style={styles.moduleNumberText}>
                    Module {m.moduleNumber} • {m.stages} lessons
                  </Text>
                  <Text style={styles.moduleTitle}>{m.title}</Text>
                  <View style={styles.moduleProgressLine} />
                </View>
              </TouchableOpacity>

              {/* Module Icon */}
              <View style={[
                styles.moduleIcon,
                m.status === 'completed' && styles.completedIcon,
                m.status === 'locked' && styles.lockedIcon,
              ]}>
                {m.status === 'completed' ? (
                  <Feather name='check' size={20} color='#fff' />
                ) : m.status === 'locked' ? (
                  <Feather name='square' size={20} color='#9E9E9E' />
                ) : (
                  <Text style={styles.iconEmoji}>{getModuleIcon(m.title)}</Text>
                )}
              </View>

              {/* Connecting Path (except for last item) */}
              {i < displaySubmodules.length - 1 && (
                <View style={styles.connectingPath} />
              )}
            </View>
          ))}
        </View>
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

  // Learning Pathway
  pathwayContainer: {
    marginTop: 8
  },
  pathwayTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 24
  },
  pathwayItem: {
    position: 'relative',
    marginBottom: 16
  },

  // Module Card
  moduleCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginRight: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6'
  },
  lockedCard: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
    opacity: 0.7
  },
  completedCard: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0'
  },
  moduleContent: {
    flex: 1
  },
  moduleNumberText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 8
  },
  moduleTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
    lineHeight: 24
  },
  moduleProgressLine: {
    height: 2,
    backgroundColor: '#E5E7EB',
    borderRadius: 1,
    width: 40
  },

  // Module Icon
  moduleIcon: {
    position: 'absolute',
    right: 20,
    top: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB'
  },
  completedIcon: {
    backgroundColor: '#10B981',
    borderColor: '#059669'
  },
  lockedIcon: {
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB'
  },
  iconEmoji: {
    fontSize: 24
  },

  // Connecting Path
  connectingPath: {
    position: 'absolute',
    right: 44,
    top: 68,
    width: 2,
    height: 32,
    backgroundColor: '#E5E7EB',
    borderRadius: 1
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

