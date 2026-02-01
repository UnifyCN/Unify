import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSanityPractices } from '@/hooks/sanity/useSanityPractices';
import { useSanitySubmoduleWithLessons } from '@/hooks/sanity/useSanitySubmodules';
import { useSanityModule } from '@/hooks/sanity/useSanityModules';

export default function PracticeListScreen() {
  const router = useRouter();
  const { moduleId, submoduleId } = useLocalSearchParams<{
    moduleId: string;
    submoduleId: string;
  }>();

  const { data: practices, isLoading, error } = useSanityPractices(
    submoduleId || ''
  );
  const { data: submoduleData } = useSanitySubmoduleWithLessons(
    submoduleId || ''
  );
  const { data: moduleData } = useSanityModule(moduleId || '');

  const subjectColor = moduleData?.colorTheme?.hex || '#10B981';

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={subjectColor} />
          <Text style={styles.loadingText}>Loading practice...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.errorText}>
            {error.message || 'Failed to load practice'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const sortedPractices = [...(practices || [])].sort(
    (a, b) => (a.order_number ?? 0) - (b.order_number ?? 0)
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Feather name="chevron-left" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Practice
        </Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>
          {submoduleData?.title || 'Section'}
        </Text>
        <Text style={styles.subtitle}>
          Test your understanding with quizzes and activities.
        </Text>

        {sortedPractices.length === 0 ? (
          <Text style={styles.emptyText}>
            No practice items for this section yet.
          </Text>
        ) : (
          sortedPractices.map((practice, index) => (
            <TouchableOpacity
              key={practice._id}
              style={[styles.card, { borderLeftColor: subjectColor }]}
              onPress={() => {
                router.push({
                  pathname:
                    '/(tabs)/Learn/modules/[moduleId]/[submoduleId]/practice/[practiceId]' as any,
                  params: { moduleId, submoduleId, practiceId: practice._id },
                });
              }}
              activeOpacity={0.8}
            >
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{practice.title}</Text>
                {practice.description ? (
                  <Text style={styles.cardDesc} numberOfLines={2}>
                    {practice.description}
                  </Text>
                ) : null}
                <Text style={styles.cardType}>
                  {practice.practice_type === 'quiz' ? 'Quiz' : 'Activity'}
                </Text>
              </View>
              <Feather name="chevron-right" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: { marginTop: 12, fontSize: 16, color: '#6B7280' },
  errorText: { fontSize: 16, color: '#EF4444', textAlign: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: { width: 44, padding: 8 },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
  },
  scroll: { padding: 24, paddingBottom: 40 },
  sectionLabel: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 24,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderLeftWidth: 4,
    padding: 16,
    marginBottom: 12,
  },
  cardContent: { flex: 1, marginRight: 12 },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 4,
  },
  cardType: {
    fontSize: 12,
    color: '#9CA3AF',
    textTransform: 'capitalize',
  },
});
