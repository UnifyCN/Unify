import { useQuery } from '@tanstack/react-query';
import { getQuizQuestions } from '../services/learn/getQuizQuestions';
import { QuizQuestion } from '../types/learn';

export const useQuizQuestions = (quizId: string) => {
  return useQuery<QuizQuestion[]>({
    queryKey: ['quizQuestions', quizId],
    queryFn: () => getQuizQuestions(quizId),
    enabled: !!quizId,
  });
};
