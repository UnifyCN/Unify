import { supabase } from '../../lib/supabase';
import type { LessonType } from './getStageLessons';

export interface LessonDetail {
  id: string;
  stage_id: string;
  title: string;
  order_num: number;
  type: LessonType;
  contents: {
    id: string;
    order_num: number;
    content_type: string;
    content: any;
  }[];
}

export const getLesson = async (lessonId: string): Promise<LessonDetail> => {
  if (!lessonId) throw new Error('Missing lessonId');

  const { data: lesson, error: lessonErr } = await supabase
    .from('lessons')
    .select('id, stage_id, title, order_num, type')
    .eq('id', lessonId)
    .single();

  if (lessonErr)
    throw new Error(`Failed to fetch lesson: ${lessonErr.message}`);

  const { data: contents, error: contErr } = await supabase
    .from('lesson_contents')
    .select('id, lesson_id, order_num, content_type, content')
    .eq('lesson_id', lessonId)
    .order('order_num');

  if (contErr)
    throw new Error(`Failed to fetch lesson contents: ${contErr.message}`);

  return {
    id: lesson.id,
    stage_id: lesson.stage_id,
    title: lesson.title,
    order_num: lesson.order_num,
    type: lesson.type as LessonType,
    contents: (contents ?? []).map(c => ({
      id: c.id,
      order_num: c.order_num,
      content_type: c.content_type,
      content: c.content,
    })),
  };
};
