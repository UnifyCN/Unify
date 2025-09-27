import { supabase } from '../../lib/supabase';

export interface ModuleData {
  id: string;
  title: string;
  description: string;
  progress_percent: number;
  is_completed: boolean;
  total_submodules: number;
  completed_submodules: number;
  submodules: SubmoduleData[];
}

export interface SubmoduleData {
  id: string;
  title: string;
  description: string;
  progress_percent: number;
  is_completed: boolean;
  total_stages: number;
  completed_stages: number;
  stages: StageData[];
}

export interface StageData {
  id: string;
  title: string;
  description: string;
  order_num: number;
  progress_percent: number;
  is_completed: boolean;
  lessons_count: number;
  completed_lessons: number;
}

export const getModule = async (moduleId: string): Promise<ModuleData> => {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('User not authenticated');
  }

  console.log('Fetching module data for moduleId:', moduleId);

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
    .single();

  // Get all submodules for this module
  const { data: submodulesData, error: submodulesError } = await supabase
    .from('submodules')
    .select('id, title, description')
    .eq('module_id', moduleId)
    .order('title');

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

  // Get all stages for all submodules
  const { data: stagesData, error: stagesError } = await supabase
    .from('stages')
    .select('id, submodule_id, title, description, order_num')
    .in('submodule_id', submoduleIds)
    .order('order_num');

  if (stagesError) {
    console.error('Error fetching stages:', stagesError);
    throw new Error(`Failed to fetch stages: ${stagesError.message}`);
  }

  const stageIds = stagesData?.map(s => s.id) || [];

  // Get user's progress for each stage
  const { data: stageProgress, error: stageProgressError } = await supabase
    .from('user_stage_progress')
    .select('stage_id, progress_percent, is_completed')
    .eq('user_id', user.id)
    .in('stage_id', stageIds);

  if (stageProgressError) {
    console.error('Error fetching stage progress:', stageProgressError);
    throw new Error(
      `Failed to fetch stage progress: ${stageProgressError.message}`
    );
  }

  // Get lesson counts for each stage
  const { data: lessonsData, error: lessonsError } = await supabase
    .from('lessons')
    .select('id, stage_id')
    .in('stage_id', stageIds);

  if (lessonsError) {
    console.error('Error fetching lessons:', lessonsError);
    throw new Error(`Failed to fetch lessons: ${lessonsError.message}`);
  }

  // Get completed lessons count
  const lessonIds = lessonsData?.map(l => l.id) || [];
  const { data: completedLessons, error: completedError } = await supabase
    .from('user_lesson_progress')
    .select('lesson_id, is_completed')
    .eq('user_id', user.id)
    .in('lesson_id', lessonIds)
    .eq('is_completed', true);

  if (completedError) {
    console.error('Error fetching completed lessons:', completedError);
    throw new Error(
      `Failed to fetch completed lessons: ${completedError.message}`
    );
  }

  // Transform data
  const submoduleProgressMap = new Map(
    submoduleProgress?.map(p => [p.submodule_id, p]) || []
  );

  const stageProgressMap = new Map(
    stageProgress?.map(p => [p.stage_id, p]) || []
  );

  const completedLessonsSet = new Set(
    completedLessons?.map(l => l.lesson_id) || []
  );

  // Group lessons by stage
  const lessonsByStage = new Map<string, any[]>();
  lessonsData?.forEach(lesson => {
    if (!lessonsByStage.has(lesson.stage_id)) {
      lessonsByStage.set(lesson.stage_id, []);
    }
    lessonsByStage.get(lesson.stage_id)!.push(lesson);
  });

  // Group stages by submodule
  const stagesBySubmodule = new Map<string, StageData[]>();
  stagesData?.forEach(stage => {
    if (!stagesBySubmodule.has(stage.submodule_id)) {
      stagesBySubmodule.set(stage.submodule_id, []);
    }

    const stageLessons = lessonsByStage.get(stage.id) || [];
    const completedStageLessons = stageLessons.filter(l =>
      completedLessonsSet.has(l.id)
    ).length;

    const stageProgressData = stageProgressMap.get(stage.id);

    stagesBySubmodule.get(stage.submodule_id)!.push({
      id: stage.id,
      title: stage.title,
      description: stage.description || '',
      order_num: stage.order_num,
      progress_percent: stageProgressData?.progress_percent || 0,
      is_completed: stageProgressData?.is_completed || false,
      lessons_count: stageLessons.length,
      completed_lessons: completedStageLessons,
    });
  });

  // Build submodules with stages
  const submodules: SubmoduleData[] =
    submodulesData?.map(submodule => {
      const progressData = submoduleProgressMap.get(submodule.id);
      const submoduleStages = stagesBySubmodule.get(submodule.id) || [];

      const completedStages = submoduleStages.filter(
        s => s.is_completed
      ).length;
      const totalStages = submoduleStages.length;

      return {
        id: submodule.id,
        title: submodule.title,
        description: submodule.description || '',
        progress_percent: progressData?.progress_percent || 0,
        is_completed: progressData?.is_completed || false,
        total_stages: totalStages,
        completed_stages: completedStages,
        stages: submoduleStages.sort((a, b) => a.order_num - b.order_num),
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
    submodules: submodules.sort((a, b) => a.title.localeCompare(b.title)),
  };
};
