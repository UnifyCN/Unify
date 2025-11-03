import { supabase } from '../../lib/supabase';
import { Lesson, LessonPage, LessonPageContent } from '../../types/learn';

export interface LessonDetail extends Lesson {}

export const getLesson = async (lessonId: string): Promise<LessonDetail> => {
  if (!lessonId) throw new Error('Missing lessonId');

  // Get lesson info
  const { data: lesson, error: lessonErr } = await supabase
    .from('lessons')
    .select('lesson_id, submodule_id, title, description, order_number')
    .eq('lesson_id', lessonId)
    .single();

  if (lessonErr)
    throw new Error(`Failed to fetch lesson: ${lessonErr.message}`);

  // Get lesson pages
  const { data: pages, error: pagesErr } = await supabase
    .from('lesson_pages')
    .select('page_id, lesson_id, title, order_number')
    .eq('lesson_id', lessonId)
    .order('order_number');

  if (pagesErr)
    throw new Error(`Failed to fetch lesson pages: ${pagesErr.message}`);

  const pageIds = pages?.map(p => p.page_id) || [];

  // Get page contents
  const { data: contents, error: contentsErr } = await supabase
    .from('lesson_page_contents')
    .select('content_id, page_id, content_type, order_number, content')
    .in('page_id', pageIds)
    .order('order_number');

  if (contentsErr)
    throw new Error(`Failed to fetch lesson contents: ${contentsErr.message}`);

  // Group contents by page
  const contentsByPage = new Map<string, LessonPageContent[]>();
  contents?.forEach(content => {
    // Start with the raw DB value
    let raw: any = content.content;

    // If DB stored JSON as a string, try to parse it
    if (typeof raw === 'string') {
      try {
        raw = JSON.parse(raw);
      } catch {
        // leave as-is if parse fails
      }
    }

    // We'll produce a canonical shape per content type so renderers keep working:
    // - rich_text / section => { sections: [...] }
    // - dropdown => { content: [...] }
    // If the DB already provides an object with those keys, keep it.
    let normalized: any = raw;

    if (content.content_type === 'dropdown') {
      if (Array.isArray(raw)) {
        normalized = { content: raw };
      } else if (raw && typeof raw === 'object') {
        if (Array.isArray(raw.content)) normalized = raw;
        else if (Array.isArray(raw.items)) normalized = { content: raw.items };
        else normalized = { content: [] };
      } else {
        normalized = { content: [] };
      }
    } else if (
      content.content_type === 'rich_text' ||
      content.content_type === 'section'
    ) {
      if (Array.isArray(raw)) {
        normalized = { sections: raw };
      } else if (raw && typeof raw === 'object') {
        if (Array.isArray(raw.sections)) normalized = raw;
        else if (Array.isArray(raw.content))
          normalized = { sections: raw.content };
        else if (Array.isArray(raw.blocks))
          normalized = { sections: raw.blocks };
        else {
          const maybe = (raw as any).sections;
          if (typeof maybe === 'string') {
            try {
              const parsed = JSON.parse(maybe);
              if (Array.isArray(parsed)) normalized = { sections: parsed };
              else normalized = { sections: [] };
            } catch {
              normalized = { sections: [] };
            }
          } else {
            normalized = { sections: [] };
          }
        }
      } else {
        normalized = { sections: [] };
      }

      // Ensure each section has a content array (wrap strings/objects into [{ text }])
      if (Array.isArray(normalized.sections)) {
        normalized.sections = normalized.sections.map((sec: any) => {
          // If the section is a primitive string, convert to a text section
          if (typeof sec === 'string') {
            return { type: 'text', content: [{ text: sec }] };
          }

          // Ensure sec is an object
          sec = sec || {};

          // If sec.content is missing but sec.text exists, wrap it
          if ((sec.content === undefined || sec.content === null) && sec.text) {
            sec.content = [{ text: String(sec.text) }];
            delete sec.text;
            return sec;
          }

          // If sec.content is a string, wrap it
          if (typeof sec.content === 'string') {
            sec.content = [{ text: sec.content }];
            return sec;
          }

          // If sec.content is an object with a text field, wrap it
          if (
            sec.content &&
            typeof sec.content === 'object' &&
            !Array.isArray(sec.content) &&
            typeof sec.content.text === 'string'
          ) {
            sec.content = [{ text: sec.content.text }];
            return sec;
          }

          // If sec.content is an array, leave it as-is
          if (Array.isArray(sec.content)) {
            return sec;
          }

          // For known single-block types like large_text_box or mid_text_box where content may be "value"
          if (
            (sec.type === 'large_text_box' || sec.type === 'mid_text_box') &&
            (typeof sec.value === 'string' || typeof sec.default === 'string')
          ) {
            const textVal = sec.value ?? sec.default ?? '';
            sec.content = [{ text: String(textVal) }];
            delete sec.value;
            delete sec.default;
            return sec;
          }

          // Fallback: ensure content is an empty array so .map is safe
          sec.content = Array.isArray(sec.content) ? sec.content : [];
          return sec;
        });
      }
    } else {
      // leave other types (text, image, mid_text_box, large_text_box, list, etc.) as-is
      normalized = raw;
    }

    const arr = contentsByPage.get(content.page_id) || [];
    arr.push({
      content_id: content.content_id,
      page_id: content.page_id,
      content_type: content.content_type as any,
      order_number: content.order_number,
      content: normalized,
    });
    contentsByPage.set(content.page_id, arr);
  });

  // Build pages with contents
  const lessonPages: LessonPage[] =
    pages?.map(page => ({
      page_id: page.page_id,
      lesson_id: page.lesson_id,
      title: page.title,
      order_number: page.order_number,
      contents: contentsByPage.get(page.page_id) || [],
    })) || [];

  return {
    lesson_id: lesson.lesson_id,
    submodule_id: lesson.submodule_id,
    title: lesson.title,
    description: lesson.description,
    order_number: lesson.order_number,
    pages: lessonPages.sort((a, b) => a.order_number - b.order_number),
  };
};
