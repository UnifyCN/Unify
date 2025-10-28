import { supabase } from '../../lib/supabase';
import {
  SubmoduleLessonsData,
  Lesson,
  SubmoduleIntro,
} from '../../types/learn';

export const getSubmoduleLessons = async (
  submoduleId: string
): Promise<SubmoduleLessonsData> => {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('User not authenticated');
  }

  // Get submodule info
  const { data: submoduleData, error: submoduleError } = await supabase
    .from('submodules')
    .select('id, title, description')
    .eq('id', submoduleId)
    .maybeSingle();

  if (submoduleError) {
    console.error('Error fetching submodule info:', submoduleError);
    throw new Error(`Failed to fetch submodule: ${submoduleError.message}`);
  }

  // Get user's progress for this submodule
  const { data: submoduleProgress, error: subProgressError } = await supabase
    .from('user_submodule_progress')
    .select('progress_percent, is_completed')
    .eq('user_id', user.id)
    .eq('submodule_id', submoduleId)
    .maybeSingle();

  if (subProgressError) {
    console.error('Error fetching submodule progress:', subProgressError);
    throw new Error(
      `Failed to fetch submodule progress: ${subProgressError.message}`
    );
  }

  // Get all lessons for this submodule
  const { data: lessonsData, error: lessonsError } = await supabase
    .from('lessons')
    .select('lesson_id, submodule_id, title, description, order_number')
    .eq('submodule_id', submoduleId)
    .order('order_number');

  if (lessonsError) {
    console.error('Error fetching lessons:', lessonsError);
    throw new Error(`Failed to fetch lessons: ${lessonsError.message}`);
  }

  const lessonIds = lessonsData?.map(l => l.lesson_id) || [];

  // Build lessons data
  const lessons: Lesson[] =
    lessonsData
      ?.map(lesson => {
        return {
          lesson_id: lesson.lesson_id,
          submodule_id: lesson.submodule_id,
          title: lesson.title,
          description: lesson.description,
          order_number: lesson.order_number,
          pages: [], // We'll load pages when needed
        };
      })
      .sort((a, b) => a.order_number.localeCompare(b.order_number)) || [];

  const completedLessons = 0; // No progress tracking for now
  const totalLessons = lessons.length;

  if (!submoduleData) {
    throw new Error('Submodule not found');
  }

  return {
    submodule_id: submoduleData.id,
    submodule_title: submoduleData.title,
    submodule_description: submoduleData.description || '',
    progress_percent: submoduleProgress?.progress_percent || 0,
    is_completed: submoduleProgress?.is_completed || false,
    total_lessons: totalLessons,
    completed_lessons: completedLessons,
    lessons,
  };
};
