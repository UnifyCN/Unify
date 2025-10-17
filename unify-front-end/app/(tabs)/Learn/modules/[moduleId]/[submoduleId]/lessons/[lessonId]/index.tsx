import React, { useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSanityLesson } from '@/hooks/sanity/useSanityLessons';

export default function LessonIndex() {
  const router = useRouter();
  const { moduleId, submoduleId, lessonId } = useLocalSearchParams<{
    moduleId: string;
    submoduleId: string;
    lessonId: string;
  }>();

  const { data: lesson, isLoading } = useSanityLesson(lessonId || '');

  useEffect(() => {
    if (lesson && lesson.pages && lesson.pages.length > 0) {
      // Redirect to first page
      router.replace({
        pathname: '/(tabs)/Learn/modules/[moduleId]/[submoduleId]/lessons/[lessonId]/pages/[pageNum]' as any,
        params: { moduleId, submoduleId, lessonId, pageNum: '1' },
      });
    }
  }, [lesson, moduleId, submoduleId, lessonId, router]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loading}>
          <Text>Loading lesson...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.loading}>
        <Text>Redirecting to lesson...</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
