import { supabase } from '@/lib/supabase';

export interface LessonData {
  id: string;
  title: string;
  order_num: number;
  type: 'flashcards' | 'dropdown' | 'video' | 'other';
  is_completed: boolean;
  progress_percent: number;
  completed_content: number;
  total_content: number;
}

export interface SubmoduleLessonsData {
  submodule_id: string;
  submodule_title: string;
  lessons: LessonData[];
  total_lessons: number;
  completed_lessons: number;
  submodule_progress_percent: number;
}

export const getSubmoduleLessons = async (submoduleId: string): Promise<SubmoduleLessonsData> => {
  try {
    // Get current user's ID
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    console.log('Fetching lessons for submodule:', submoduleId, 'user:', user.id);

    // Get submodule info
    const { data: submoduleData, error: submoduleError } = await supabase
      .from('submodules')
      .select('id, title')
      .eq('id', submoduleId)
      .single();

    if (submoduleError) {
      console.error('Error fetching submodule:', submoduleError);
      throw new Error(`Failed to fetch submodule: ${submoduleError.message}`);
    }

    // Get user's progress for this submodule
    const { data: submoduleProgress, error: subProgressError } = await supabase
      .from('user_submodule_progress')
      .select('progress_percent')
      .eq('user_id', user.id)
      .eq('submodule_id', submoduleId)
      .single();

    if (subProgressError && subProgressError.code !== 'PGRST116') {
      console.error('Error fetching submodule progress:', subProgressError);
    }

    // Get all lessons for the submodule
    const { data: lessonsData, error: lessonsError } = await supabase
      .from('lessons')
      .select('id, title, order_num, type')
      .eq('submodule_id', submoduleId)
      .order('order_num', { ascending: true });

    if (lessonsError) {
      console.error('Error fetching lessons:', lessonsError);
      throw new Error(`Failed to fetch lessons: ${lessonsError.message}`);
    }

    // Get user progress for all lessons in this submodule
    const lessonIds = lessonsData?.map(lesson => lesson.id) || [];
    const { data: progressData, error: progressError } = await supabase
      .from('user_lesson_progress')
      .select('lesson_id, completed_content, total_content, is_completed')
      .eq('user_id', user.id)
      .in('lesson_id', lessonIds);

    if (progressError) {
      console.error('Error fetching lesson progress:', progressError);
    }

    // Transform the data
    const transformedLessons: LessonData[] = (lessonsData || []).map((lesson: any) => {
      const progress = progressData?.find(p => p.lesson_id === lesson.id);
      const progressPercent = progress?.total_content 
        ? (progress.completed_content / progress.total_content) * 100 
        : 0;

      return {
        id: lesson.id,
        title: lesson.title,
        order_num: lesson.order_num,
        type: lesson.type,
        is_completed: progress?.is_completed || false,
        progress_percent: progressPercent,
        completed_content: progress?.completed_content || 0,
        total_content: progress?.total_content || 1,
      };
    });

    const completedLessons = transformedLessons.filter(lesson => lesson.is_completed).length;

    return {
      submodule_id: submoduleData.id,
      submodule_title: submoduleData.title,
      lessons: transformedLessons,
      total_lessons: transformedLessons.length,
      completed_lessons: completedLessons,
      submodule_progress_percent: submoduleProgress?.progress_percent || 0,
    };
  } catch (error) {
    console.error('Error fetching submodule lessons:', error);
    throw error;
  }
};
