import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams, Link } from 'expo-router';
import { getModule } from '../../../data/pathways';
import { Feather } from '@expo/vector-icons';

export default function ModuleOverview() {
  const router = useRouter();
  // We push these from path-way-finance.tsx: { pathId, moduleId }
  const { pathId, moduleId } = useLocalSearchParams<{
    pathId: string;
    moduleId: string;
  }>();
  const { pathway, module } = getModule(pathId || '', moduleId || '');

  // Guard: if params or data missing, show a lightweight fallback
  if (!pathway || !module) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={{ padding: 20, gap: 8 }}>
          <Text style={{ fontWeight: '700' }}>Module not found</Text>
          <Text>
            pathId: {String(pathId)} • moduleId: {String(moduleId)}
          </Text>
          <Link href='/(tabs)/Learn'>Go back to Learn</Link>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.iconBtn}
          >
            <Feather name='chevron-left' size={24} color='#333' />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {}} style={styles.iconBtn}>
            <Feather name='menu' size={20} color='#333' />
          </TouchableOpacity>
        </View>

        {/* Titles */}
        <Text style={styles.pathwayTitle}>{pathway.title}</Text>
        <Text style={styles.moduleTitle}>{module.subtitle}</Text>

        {/* Image / video placeholder */}
        <View style={styles.media} />

        {/* Objectives */}
        <Text style={styles.sectionLead}>
          By the end of this module, you will…
        </Text>
        <View style={{ gap: 12, marginTop: 8 }}>
          {(module.objectives ?? []).map((obj, i) => (
            <View key={i} style={styles.bulletRow}>
              <Feather name='check-circle' size={18} color='#444' />
              <Text style={styles.bulletText}>{obj}</Text>
            </View>
          ))}
        </View>

        {/* Big Resume button that goes to lesson/topics screen */}
        <TouchableOpacity
          style={styles.resumeBig}
          onPress={() => {
            router.push({
              pathname:
                '/(tabs)/Learn/moduleComponents/sub-module-presentation',
              // pass along context if you want the next screen to know which module:
              params: { pathId, moduleId },
            });
          }}
        >
          <Text style={styles.resumeBigText}>
            {`Resume ${module.currentLessonId ? `Lesson ${module.currentLessonId.slice(1)}` : 'Lesson 1'}`}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { padding: 20, paddingBottom: 40 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconBtn: { padding: 6 },

  pathwayTitle: { marginTop: 10, textAlign: 'center', color: '#777' },
  moduleTitle: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 6,
    color: '#000',
  },

  media: {
    height: 160,
    borderRadius: 12,
    backgroundColor: '#E5E5E5',
    marginTop: 16,
  },

  sectionLead: { marginTop: 20, fontWeight: '700', color: '#444' },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  bulletText: { flex: 1, color: '#444' },

  resumeBig: {
    marginTop: 24,
    backgroundColor: '#777',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  resumeBigText: { color: '#fff', fontWeight: '700' },
});
