import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';

export default function LessonScreen() {
  const router = useRouter();
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <Feather name='chevron-left' size={24} color='#333' />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title}>Lesson Content</Text>
          <Text style={styles.subtitle}>Lesson ID: {lessonId}</Text>
          <Text style={styles.description}>
            Lesson will be done after lol
          </Text>

          <TouchableOpacity 
            style={styles.completeButton}
            onPress={() => {
              // Here you would mark the lesson as completed
              // and update the user_lesson_progress table
              router.back();
            }}
          >
            <Text style={styles.completeButtonText}>Mark as Complete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, padding: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  iconBtn: { padding: 6 },
  
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '700', color: '#000', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 20 },
  description: { 
    fontSize: 16, 
    color: '#333', 
    textAlign: 'center', 
    lineHeight: 24,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  
  completeButton: {
    backgroundColor: '#2F97C4',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
