import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Dimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSubmoduleStages } from '@/hooks/learn/useSubmoduleStages';
import { Feather } from '@expo/vector-icons';

export default function SubmoduleIndex() {
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
            <Feather name='chevron-left' size={24} color='#000' />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => {
              router.push({
                pathname: '/(tabs)/Learn/modules/[moduleId]/[submoduleId]/map' as any,
                params: { moduleId, submoduleId },
              });
            }} 
            style={styles.menuButton}
          >
            <Feather name='menu' size={20} color='#000' />
          </TouchableOpacity>
        </View>

        {/* Module Label */}
        <Text style={styles.moduleLabel}>Finance for Newcomers</Text>

        {/* Submodule Title */}
        <Text style={styles.title}>{submoduleData.submodule_title}</Text>

        {/* Media Placeholder */}
        <View style={styles.mediaPlaceholder}>
          <Text style={styles.mediaPlaceholderText}>Video/Media Content</Text>
        </View>

        {/* Learning Objectives */}
        <View style={styles.objectivesSection}>
          <Text style={styles.objectivesTitle}>By the end of this module, you will...</Text>
          
          <View style={styles.objectivesList}>
            <View style={styles.objectiveItem}>
              <View style={styles.checkIcon}>
                <Feather name='check' size={16} color='#fff' />
              </View>
              <Text style={styles.objectiveText}>
                Know information about the major banking institutions available in Canada
              </Text>
            </View>
            
            <View style={styles.objectiveItem}>
              <View style={styles.checkIcon}>
                <Feather name='check' size={16} color='#fff' />
              </View>
              <Text style={styles.objectiveText}>
                Know how to navigate various financial accounts you will need to settle in
              </Text>
            </View>
            
            <View style={styles.objectiveItem}>
              <View style={styles.checkIcon}>
                <Feather name='check' size={16} color='#fff' />
              </View>
              <Text style={styles.objectiveText}>
                Know how to take action and open or close certain financial accounts
              </Text>
            </View>
          </View>
        </View>

        {/* Resume Button */}
        <TouchableOpacity
          style={styles.resumeButton}
          onPress={() => {
            // TODO: Add navigation to lesson when implemented
            console.log('Resume lesson clicked');
          }}
        >
          <Text style={styles.resumeButtonText}>
            Resume Lesson {submoduleData.stages.findIndex((stage: any) => !stage.is_completed) + 1 || 1}
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
    backgroundColor: '#fff' 
  },
  container: { 
    paddingHorizontal: 20, 
    paddingBottom: 40,
    minHeight: '100%'
  },
  
  // Header
  headerRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20
  },
  backButton: { 
    padding: 8,
    marginLeft: -8
  },
  menuButton: {
    padding: 8,
    marginRight: -8
  },

  // Module Label
  moduleLabel: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '500'
  },

  // Title
  title: { 
    fontSize: 32, 
    fontWeight: '700', 
    textAlign: 'center', 
    color: '#000',
    marginBottom: 32,
    lineHeight: 38
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
    borderColor: '#E5E7EB'
  },
  mediaPlaceholderText: {
    fontSize: 16,
    color: '#9CA3AF',
    fontWeight: '500'
  },

  // Objectives Section
  objectivesSection: {
    marginBottom: 40
  },
  objectivesTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 20,
    lineHeight: 26
  },
  objectivesList: {
    gap: 16
  },
  objectiveItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12
  },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2
  },
  objectiveText: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    lineHeight: 24
  },

  // Resume Button
  resumeButton: {
    backgroundColor: '#374151',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  resumeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
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