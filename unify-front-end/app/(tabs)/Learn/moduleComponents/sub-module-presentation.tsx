import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { getModule } from '../../../data/pathways';

export default function SubModulePresentation() {
  const router = useRouter();
  const { pathId, moduleId } = useLocalSearchParams<{ pathId: string; moduleId: string }>();
  const { pathway, module } = getModule(pathId || '', moduleId || '');

  if (!pathway || !module) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Missing module data.</Text>
      </SafeAreaView>
    );
  }

  const pct = Math.round((module.progress ?? 0) * 100);
  const hasProgress = (module.progress ?? 0) > 0;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <Feather name='chevron-left' size={24} color='#333' />
          </TouchableOpacity>
        </View>

        {/* Card at top like your mock */}
        <View style={styles.stageCard}>
          <Text style={styles.stageTitle}>{module.subtitle}</Text>
          <Text style={styles.stageDesc}>
            {hasProgress
              ? `You’re ${pct}% through this module. Pick up where you left off.`
              : 'Understand why banking matters, identify account types, and set up your banking in Canada.'}
          </Text>

          <TouchableOpacity
            style={styles.cta}
            onPress={() => {
              // go to the first lesson topic screen, but right nbow it just goes back to the prev pg
              router.push({
                pathname: '/(tabs)/Learn/Lessons/module-overview',
                params: { pathId, moduleId },
              });
            }}
          >
            <Text style={styles.ctaText}>{hasProgress ? 'Retake Lesson' : 'Start Lesson'}</Text>
          </TouchableOpacity>
        </View>

        {/* Example stage dots area placeholder */}
        <View style={styles.mapArea}>
          <Text style={{ color: '#666' }}>Stage map goes here (bubbles).</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { padding: 20, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { padding: 6 },

  stageCard: {
    marginTop: 14,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  stageTitle: { fontSize: 18, fontWeight: '700', color: '#111' },
  stageDesc: { marginTop: 8, color: '#555' },

  cta: {
    marginTop: 12,
    backgroundColor: '#efefef',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  ctaText: { fontWeight: '700', color: '#444' },

  mapArea: {
    marginTop: 20,
    height: 360,
    backgroundColor: '#F4F4F5',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
