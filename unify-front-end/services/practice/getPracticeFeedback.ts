import { supabase } from '@/lib/supabase';

export interface PracticeFeedbackRequest {
  questionText: string;
  userAnswer: string;
  expectedAnswer?: string;
  practiceTitle?: string;
}

export async function getPracticeFeedback(
  request: PracticeFeedbackRequest
): Promise<string> {
  let data, error;
  try {
    const result = await supabase.functions.invoke('practice-feedback', {
      body: request,
    });
    data = result.data;
    error = result.error;
  } catch (err: any) {
    throw new Error(
      `Failed to reach feedback service: ${err.message || err}`
    );
  }

  if (error) {
    throw new Error(error.message || 'Failed to get feedback');
  }

  if (!data?.feedback) {
    throw new Error('No feedback available');
  }

  return data.feedback;
}
