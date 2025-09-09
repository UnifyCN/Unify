import { supabase } from '@/lib/supabase';

export interface SubmoduleData {
  id: string;
  title: string;
  description: string;
  progress_percent: number;
  is_completed: boolean;
  lessons_count: number;
  completed_lessons: number;
}

export interface FinanceModuleData {
  id: string;
  title: string;
  description: string;
  progress_percent: number;
  is_completed: boolean;
  submodules: SubmoduleData[];
  total_submodules: number;
  completed_submodules: number;
}

export const getFinanceModule = async (): Promise<FinanceModuleData> => {
  try {
    // Get current user's ID
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    console.log('Fetching Finance module for user:', user.id);

    // Get the Finance module info
    const { data: moduleInfo, error: moduleError } = await supabase
      .from('modules')
      .select('id, title, description')
      .eq('id', '11111111-1111-1111-1111-111111111111')
      .single();

    if (moduleError) {
      console.error('Error fetching module info:', moduleError);
      throw new Error(`Failed to fetch module info: ${moduleError.message}`);
    }

    // Get user's progress for this module
    const { data: moduleProgress, error: progressError } = await supabase
      .from('user_module_progress')
      .select('progress_percent, is_completed')
      .eq('user_id', user.id)
      .eq('module_id', '11111111-1111-1111-1111-111111111111')
      .single();

    if (progressError && progressError.code !== 'PGRST116') {
      console.error('Error fetching module progress:', progressError);
      // Don't throw error, just use default values
    }

    // Get all submodules for the Finance module
    const { data: submodulesData, error: submodulesError } = await supabase
      .from('submodules')
      .select('id, title, description')
      .eq('module_id', '11111111-1111-1111-1111-111111111111');

    if (submodulesError) {
      console.error('Error fetching submodules:', submodulesError);
      throw new Error(`Failed to fetch submodules: ${submodulesError.message}`);
    }

    // Get user's progress for each submodule
    const submoduleIds = submodulesData?.map(sub => sub.id) || [];
    const { data: submoduleProgress, error: subProgressError } = await supabase
      .from('user_submodule_progress')
      .select('submodule_id, progress_percent, is_completed')
      .eq('user_id', user.id)
      .in('submodule_id', submoduleIds);

    if (subProgressError) {
      console.error('Error fetching submodule progress:', subProgressError);
    }

    // Get lesson counts for each submodule
    const { data: lessonsData, error: lessonsError } = await supabase
      .from('lessons')
      .select('id, submodule_id')
      .in('submodule_id', submoduleIds);

    if (lessonsError) {
      console.error('Error fetching lessons:', lessonsError);
    }

    // Get completed lessons count
    const lessonIds = lessonsData?.map(lesson => lesson.id) || [];
    const { data: completedLessons, error: completedError } = await supabase
      .from('user_lesson_progress')
      .select('lesson_id, is_completed')
      .eq('user_id', user.id)
      .in('lesson_id', lessonIds)
      .eq('is_completed', true);

    if (completedError) {
      console.error('Error fetching completed lessons:', completedError);
    }

    // Transform the data
    const transformedSubmodules: SubmoduleData[] = (submodulesData || []).map((submodule: any) => {
      const progress = submoduleProgress?.find(p => p.submodule_id === submodule.id);
      const totalLessons = lessonsData?.filter(l => l.submodule_id === submodule.id).length || 0;
      const completedLessonsCount = completedLessons?.filter(
        cl => lessonsData?.find(l => l.id === cl.lesson_id && l.submodule_id === submodule.id)
      ).length || 0;

      return {
        id: submodule.id,
        title: submodule.title,
        description: submodule.description,
        progress_percent: progress?.progress_percent || 0,
        is_completed: progress?.is_completed || false,
        lessons_count: totalLessons,
        completed_lessons: completedLessonsCount,
      };
    });

    const completedSubmodules = transformedSubmodules.filter(sub => sub.is_completed).length;

    return {
      id: moduleInfo?.id || '11111111-1111-1111-1111-111111111111',
      title: moduleInfo?.title || 'Finance',
      description: moduleInfo?.description || 'Learn the basics of personal finance.',
      progress_percent: moduleProgress?.progress_percent || 0,
      is_completed: moduleProgress?.is_completed || false,
      submodules: transformedSubmodules,
      total_submodules: transformedSubmodules.length,
      completed_submodules: completedSubmodules,
    };
  } catch (error) {
    console.error('Error fetching Finance module:', error);
    throw error;
  }
};
