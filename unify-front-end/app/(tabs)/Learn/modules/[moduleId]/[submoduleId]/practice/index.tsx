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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSanityPractices } from '@/hooks/sanity/useSanityPractices';
import { useSanitySubmoduleWithLessons } from '@/hooks/sanity/useSanitySubmodules';
import { useSanityModuleWithSubmodules } from '@/hooks/sanity/useSanityModules';

export default function PracticeListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
  const { data: moduleData } = useSanityModuleWithSubmodules(moduleId || '');

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
    <View style={styles.pageContainer}>
      {/* Header: same as submodule index */}
      <View
        style={[
          styles.header,
          { backgroundColor: '#FFFFFF', paddingTop: insets.top },
        ]}
      >
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            onPress={() =>
              router.replace({
                pathname: '/(tabs)/Learn/modules/[moduleId]/[submoduleId]' as any,
                params: { moduleId, submoduleId },
              })
            }
            style={styles.backButton}
          >
            <Feather name="chevron-left" size={28} color="#000" />
          </TouchableOpacity>
          <View style={styles.headerCenterWrap}>
            <Text style={styles.headerModuleName} numberOfLines={1}>
              Practice
            </Text>
          </View>
          <View style={styles.headerRightPlaceholder} />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
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
    </View>
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
  pageContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    position: 'relative' as const,
    overflow: 'hidden',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 15,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenterWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 5,
  },
  headerModuleName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
  },
  headerRightPlaceholder: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  scroll: { paddingHorizontal: 24, paddingTop: 5, paddingBottom: 40 },
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
    marginTop: 40,
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
