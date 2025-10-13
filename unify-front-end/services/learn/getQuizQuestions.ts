import { supabase } from '../../lib/supabase';
import { QuizQuestion } from '../../types/learn';

export const getQuizQuestions = async (quizId: string): Promise<QuizQuestion[]> => {
  if (!quizId) throw new Error('Missing quizId');

  const { data: questions, error } = await supabase
    .from('quiz_questions')
    .select('id, quiz_id, question_type, question_text, options, correct_answer, order_num')
    .eq('quiz_id', quizId)
    .order('order_num');


  if (error) {
    throw new Error(`Failed to fetch quiz questions: ${error.message}`);
  }

  return questions || [];
};
