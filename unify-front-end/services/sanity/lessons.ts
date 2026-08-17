import { sanityClient } from '../../sanity-custom';
import { SanityLesson } from '../../types/sanity';
import {
  BASE_LANGUAGE_FILTER,
  i18nOverlay,
  mergeI18nOverlay,
  type SanityLanguage,
  type WithI18n,
} from './i18n';

// Get a single lesson by ID
export async function getLesson(
  lessonId: string,
  language: SanityLanguage = 'en'
): Promise<SanityLesson | null> {
  try {
    const query = `*[_type == "lesson" && _id == $lessonId && ${BASE_LANGUAGE_FILTER}][0] {
      _id,
      _type,
      title,
      slug,
      description,
      submodule,
      pages,
      activity_pages,
      ending_pages,
      order,
      ${i18nOverlay('title, description, pages, activity_pages, ending_pages')}
    }`;

    const lesson = await sanityClient.fetch<WithI18n<SanityLesson> | null>(
      query,
      { lessonId, lang: language }
    );
    return lesson ? mergeI18nOverlay(lesson) : null;
  } catch (error) {
    console.error('Error fetching lesson from Sanity:', error);
    return null;
  }
}
