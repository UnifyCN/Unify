import { supabase } from '../../lib/supabase';
import { SubmoduleInfo } from '../../types/learn';

export interface ModuleData {
  id: string;
  title: string;
  description: string;
  progress_percent: number;
  is_completed: boolean;
  total_submodules: number;
  completed_submodules: number;
  submodules: SubmoduleInfo[];
}

export const getModule = async (moduleId: string): Promise<ModuleData> => {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('User not authenticated');
  }

  // Get module info
  const { data: moduleInfo, error: moduleError } = await supabase
    .from('modules')
    .select('id, title, description')
    .eq('id', moduleId)
    .single();

  if (moduleError) {
    console.error('Error fetching module info:', moduleError);
    throw new Error(`Failed to fetch module: ${moduleError.message}`);
  }

  // Get user's progress for this module
  const { data: moduleProgress, error: progressError } = await supabase
    .from('user_module_progress')
    .select('progress_percent, is_completed')
    .eq('user_id', user.id)
    .eq('module_id', moduleId)
    .maybeSingle();

  // Get all submodules for this module
  const { data: submodulesData, error: submodulesError } = await supabase
    .from('submodules')
    .select('id, title, description, order_num')
    .eq('module_id', moduleId)
    .order('order_num');

  if (submodulesError) {
    console.error('Error fetching submodules:', submodulesError);
    throw new Error(`Failed to fetch submodules: ${submodulesError.message}`);
  }

  const submoduleIds = submodulesData?.map(s => s.id) || [];

  // Get user's progress for each submodule
  const { data: submoduleProgress, error: subProgressError } = await supabase
    .from('user_submodule_progress')
    .select('submodule_id, progress_percent, is_completed')
    .eq('user_id', user.id)
    .in('submodule_id', submoduleIds);

  if (subProgressError) {
    console.error('Error fetching submodule progress:', subProgressError);
    throw new Error(
      `Failed to fetch submodule progress: ${subProgressError.message}`
    );
  }

  // Get all lessons for all submodules
  const { data: lessonsData, error: lessonsError } = await supabase
    .from('lessons')
    .select('lesson_id, submodule_id')
    .in('submodule_id', submoduleIds);

  if (lessonsError) {
    console.error('Error fetching lessons:', lessonsError);
    throw new Error(`Failed to fetch lessons: ${lessonsError.message}`);
  }

  // Get completed lessons count - no progress tracking for now
  const lessonIds = lessonsData?.map(l => l.lesson_id) || [];
  const completedLessons: any[] = []; // No progress tracking for now

  // Transform data
  const submoduleProgressMap = new Map(
    submoduleProgress?.map(p => [p.submodule_id, p]) || []
  );

  const completedLessonsSet = new Set(
    completedLessons?.map(l => l.lesson_id) || []
  );

  // Group lessons by submodule
  const lessonsBySubmodule = new Map<string, any[]>();
  lessonsData?.forEach(lesson => {
    if (!lessonsBySubmodule.has(lesson.submodule_id)) {
      lessonsBySubmodule.set(lesson.submodule_id, []);
    }
    lessonsBySubmodule.get(lesson.submodule_id)!.push(lesson);
  });

  // Build submodules with lessons
  const submodules: SubmoduleInfo[] =
    submodulesData?.map(submodule => {
      const progressData = submoduleProgressMap.get(submodule.id);
      const submoduleLessons = lessonsBySubmodule.get(submodule.id) || [];

      const completedLessonsCount = submoduleLessons.filter(l =>
        completedLessonsSet.has(l.id)
      ).length;
      const totalLessons = submoduleLessons.length;

      return {
        id: submodule.id,
        title: submodule.title,
        description: submodule.description || '',
        order_num: submodule.order_num,
        module_id: moduleId,
        progress_percent: progressData?.progress_percent || 0,
        is_completed: progressData?.is_completed || false,
        total_lessons: totalLessons,
        completed_lessons: completedLessonsCount,
      };
    }) || [];

  const completedSubmodules = submodules.filter(s => s.is_completed).length;
  const totalSubmodules = submodules.length;

  return {
    id: moduleInfo.id,
    title: moduleInfo.title,
    description: moduleInfo.description || '',
    progress_percent: moduleProgress?.progress_percent || 0,
    is_completed: moduleProgress?.is_completed || false,
    total_submodules: totalSubmodules,
    completed_submodules: completedSubmodules,
    submodules: submodules.sort((a, b) => a.order_num - b.order_num),
  };
};
