import { sanityClient } from '../../sanity-custom';
import { SanityLesson } from '../../types/sanity';

// Get a single lesson by ID
export async function getLesson(
  lessonId: string
): Promise<SanityLesson | null> {
  try {
    const query = `*[_type == "lesson" && _id == $lessonId][0] {
      _id,
      _type,
      title,
      slug,
      description,
      submodule,
      pages,
      activity_pages,
      ending_pages,
      order
    }`;

    const lesson = await sanityClient.fetch(query, { lessonId });
    return lesson || null;
  } catch (error) {
    console.error('Error fetching lesson from Sanity:', error);
    return null;
  }
}
