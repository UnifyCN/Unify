import { supabase } from '@/lib/supabase';
import { PersonalizedChecklistTask, Stage } from '@/types/checklist';
import { stageNumberToEnum } from '@/helpers/dateHelpers';

export const getPersonalizedTasks = async (
  persona: string,
  stage: number | Stage
): Promise<PersonalizedChecklistTask[]> => {
  try {
    // Convert stage number to enum string if needed
    const stageEnum =
      typeof stage === 'number' ? stageNumberToEnum(stage) : stage;

    // First try with the provided persona value
    let { data, error } = await supabase
      .from('personalized_checklist_tasks')
      .select('*')
      .eq('persona', persona)
      .eq('stage', stageEnum);

    if (error) {
      console.error('📋 getPersonalizedTasks - Query error:', error);
      throw new Error(`Failed to fetch personalized tasks: ${error.message}`);
    }

    // If no results, try with title case version (e.g., "International Student")
    if (!data || data.length === 0) {
      const titleCasePersona = persona
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      const result = await supabase
        .from('personalized_checklist_tasks')
        .select('*')
        .eq('persona', titleCasePersona)
        .eq('stage', stageEnum);

      data = result.data;
      error = result.error;

      if (error) {
        console.error('📋 getPersonalizedTasks - Retry query error:', error);
      }
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching personalized tasks:', error);
    throw error;
  }
};
