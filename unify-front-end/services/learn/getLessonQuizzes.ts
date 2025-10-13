import { supabase } from '../../lib/supabase';
import { Quiz } from '../../types/learn';

export const getLessonQuizzes = async (lessonId: string): Promise<Quiz[]> => {
  if (!lessonId) throw new Error('Missing lessonId');

  const { data: quizzes, error } = await supabase
    .from('quizzes')
    .select('quiz_id, lesson_id, title, description, passing_score, order_number')
    .eq('lesson_id', lessonId)
    .order('order_number');

  if (error) {
    throw new Error(`Failed to fetch quizzes: ${error.message}`);
  }

  return quizzes || [];
};
