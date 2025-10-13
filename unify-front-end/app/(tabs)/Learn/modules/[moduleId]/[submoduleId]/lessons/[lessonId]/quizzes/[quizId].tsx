import React, { useEffect } from 'react';
import { useLocalSearchParams, router } from 'expo-router';

export default function QuizIndex() {
  const { moduleId, submoduleId, lessonId, quizId } = useLocalSearchParams<{
    moduleId: string;
    submoduleId: string;
    lessonId: string;
    quizId: string;
  }>();

  useEffect(() => {
    // Redirect to first question
    router.replace({
      pathname: '/(tabs)/Learn/modules/[moduleId]/[submoduleId]/lessons/[lessonId]/quizzes/[quizId]/pages/[questionNum]' as any,
      params: { 
        moduleId, 
        submoduleId, 
        lessonId, 
        quizId, 
        questionNum: '1' 
      },
    });
  }, []);

  return null;
}

