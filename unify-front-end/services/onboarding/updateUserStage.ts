import { supabase } from '@/lib/supabase';
import { stageNumberToEnum } from '@/helpers/dateHelpers';

export const updateUserStage = async (
  userId: string,
  stageNumber: number
): Promise<void> => {
  try {
    const stage = stageNumberToEnum(stageNumber);
    const { error } = await supabase
      .from('user_onboarding_profiles')
      .update({ stage })
      .eq('id', userId);

    if (error) {
      throw new Error(`Failed to update user stage: ${error.message}`);
    }
  } catch (error) {
    console.error('Error updating user stage:', error);
    throw error;
  }
};
