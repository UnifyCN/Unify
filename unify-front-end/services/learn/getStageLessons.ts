import { supabase } from '../../lib/supabase';

export type LessonType = 'flashcards' | 'dropdown' | 'video' | 'other';

export interface LessonContent {
  id: string;
  order_num: number;
  content_type: string;
  content: any;
}

export interface LessonItem {
  id: string;
  stage_id: string;
  title: string;
  order_num: number;
  type: LessonType;
  contents: LessonContent[];
}

export const getStageLessons = async (stageId: string): Promise<LessonItem[]> => {
  if (!stageId) throw new Error('Missing stageId');

  // Fetch lessons for the stage
  const { data: lessons, error: lessonsError } = await supabase
    .from('lessons')
    .select('id, stage_id, title, order_num, type')
    .eq('stage_id', stageId)
    .order('order_num');

  if (lessonsError) {
    throw new Error(`Failed to fetch lessons: ${lessonsError.message}`);
  }

  const lessonIds = (lessons ?? []).map(l => l.id);
  if (lessonIds.length === 0) return [];

  // Fetch contents for all lessons in one query
  const { data: contents, error: contentsError } = await supabase
    .from('lesson_contents')
    .select('id, lesson_id, order_num, content_type, content')
    .in('lesson_id', lessonIds)
    .order('order_num');

  if (contentsError) {
    throw new Error(`Failed to fetch lesson contents: ${contentsError.message}`);
  }

  const contentsByLesson = new Map<string, LessonContent[]>();
  (contents ?? []).forEach(c => {
    const arr = contentsByLesson.get(c.lesson_id) ?? [];
    arr.push({ id: c.id, order_num: c.order_num, content_type: c.content_type, content: c.content });
    contentsByLesson.set(c.lesson_id, arr);
  });

  return (lessons ?? []).map(l => ({
    id: l.id,
    stage_id: l.stage_id,
    title: l.title,
    order_num: l.order_num,
    type: l.type as LessonType,
    contents: contentsByLesson.get(l.id) ?? [],
  }));
};


