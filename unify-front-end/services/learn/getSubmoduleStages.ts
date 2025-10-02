import { supabase } from '../../lib/supabase';

export interface SubmoduleStagesData {
  submodule_id: string;
  submodule_title: string;
  submodule_description: string;
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

export const getSubmoduleStages = async (submoduleId: string): Promise<SubmoduleStagesData> => {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    throw new Error('User not authenticated');
  }

  console.log('Fetching submodule stages for submoduleId:', submoduleId);

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
    .single();

  if (subProgressError) {
    console.error('Error fetching submodule progress:', subProgressError);
    throw new Error(`Failed to fetch submodule progress: ${subProgressError.message}`);
  }

  // Get all stages for this submodule
  const { data: stagesData, error: stagesError } = await supabase
    .from('stages')
    .select('id, title, description, order_num')
    .eq('submodule_id', submoduleId)
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
    throw new Error(`Failed to fetch stage progress: ${stageProgressError.message}`);
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
    throw new Error(`Failed to fetch completed lessons: ${completedError.message}`);
  }

  // Transform data
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

  // Build stages data
  const stages: StageData[] = stagesData?.map(stage => {
    const stageLessons = lessonsByStage.get(stage.id) || [];
    const completedStageLessons = stageLessons.filter(l => completedLessonsSet.has(l.id)).length;
    
    const stageProgressData = stageProgressMap.get(stage.id);

    return {
      id: stage.id,
      title: stage.title,
      description: stage.description || '',
      order_num: stage.order_num,
      progress_percent: stageProgressData?.progress_percent || 0,
      is_completed: stageProgressData?.is_completed || false,
      lessons_count: stageLessons.length,
      completed_lessons: completedStageLessons,
    };
  }).sort((a, b) => a.order_num - b.order_num) || [];

  const completedStages = stages.filter(s => s.is_completed).length;
  const totalStages = stages.length;

  if (!submoduleData) {
    throw new Error('Submodule not found');
  }

  return {
    submodule_id: submoduleData.id,
    submodule_title: submoduleData.title,
    submodule_description: submoduleData.description || '',
    progress_percent: submoduleProgress?.progress_percent || 0,
    is_completed: submoduleProgress?.is_completed || false,
    total_stages: totalStages,
    completed_stages: completedStages,
    stages,
  };
};

