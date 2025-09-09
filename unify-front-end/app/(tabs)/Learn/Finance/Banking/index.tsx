import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams, Link } from 'expo-router';
import { useSubmoduleLessons } from '@/hooks/learn/useSubmoduleLessons';
import { Feather } from '@expo/vector-icons';

export default function ModuleOverview() {
  const router = useRouter();
  const { submoduleId } = useLocalSearchParams<{ submoduleId: string }>();
  
  const { data: submoduleData, isLoading, error } = useSubmoduleLessons(submoduleId || '');

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading Banking module...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !submoduleData) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Error loading module: {error?.message || 'Unknown error'}</Text>
          <Link href='/(tabs)/Learn'>Go back to Learn</Link>
        </View>
      </SafeAreaView>
    );
  }

  // Derive next (resume) lesson
  const lessons = submoduleData.lessons || [];
  const currentLesson = lessons.find(l => !l.is_completed) || lessons[0];
  const nextLessonId = currentLesson?.id;

  const goToPresentation = () => {
    if (!submoduleId) return;
    router.push({
      pathname: '/(tabs)/Learn/Finance/Banking/sub-module-presentation',
      params: { submoduleId },
    });
  };

  const goToLesson = () => {
    if (!nextLessonId) return;
    router.push({
      pathname: '/(tabs)/Learn/Finance/Banking/lesson',
      params: { lessonId: nextLessonId },
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <Feather name='chevron-left' size={24} color='#333' />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {}} style={styles.iconBtn}>
            <Feather name='menu' size={20} color='#333' />
          </TouchableOpacity>
        </View>

        {/* Titles */}
        <Text style={styles.pathwayTitle}>Finance</Text>
        <Text style={styles.moduleTitle}>{submoduleData.submodule_title}</Text>

        {/* Image / video placeholder */}
        <View style={styles.media} />

        {/* Objectives */}
        <Text style={styles.sectionLead}>By the end of this module, you will…</Text>
        <View style={{ gap: 12, marginTop: 8 }}>
          <View style={styles.bulletRow}>
            <Feather name='check-circle' size={18} color='#444' />
            <Text style={styles.bulletText}>Understand how banks work</Text>
          </View>
          <View style={styles.bulletRow}>
            <Feather name='check-circle' size={18} color='#444' />
            <Text style={styles.bulletText}>Learn about different account types</Text>
          </View>
          <View style={styles.bulletRow}>
            <Feather name='check-circle' size={18} color='#444' />
            <Text style={styles.bulletText}>Know how to choose the right bank</Text>
          </View>
        </View>

        {/* Big Resume button that goes to lesson/topics screen */}
        <TouchableOpacity style={styles.resumeBig} onPress={goToPresentation}>
          <Text style={styles.resumeBigText}>
            {currentLesson ? `Resume Overview (${currentLesson.title})` : 'Open Overview'}
          </Text>
        </TouchableOpacity>

        {nextLessonId && (
          <TouchableOpacity style={styles.resumeAlt} onPress={goToLesson}>
            <Text style={styles.resumeAltText}>
              {currentLesson?.is_completed ? 'Review First Lesson' : 'Jump To Lesson'}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { padding: 20, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  iconBtn: { padding: 6 },

  pathwayTitle: { marginTop: 10, textAlign: 'center', color: '#777' },
  moduleTitle: { fontSize: 28, fontWeight: '700', textAlign: 'center', marginTop: 6, color: '#000' },

  media: { height: 160, borderRadius: 12, backgroundColor: '#E5E5E5', marginTop: 16 },

  sectionLead: { marginTop: 20, fontWeight: '700', color: '#444' },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  bulletText: { flex: 1, color: '#444' },

  resumeBig: { marginTop: 24, backgroundColor: '#777', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  resumeBigText: { color: '#fff', fontWeight: '700' },
  resumeAlt: { marginTop: 14, backgroundColor: '#EDEDED', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  resumeAltText: { color: '#333', fontWeight: '600' },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#FF6B6B',
    textAlign: 'center',
  },
});
