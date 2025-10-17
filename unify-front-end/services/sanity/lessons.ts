import { sanityClient } from '../../sanity-custom';
import { SanityLesson, SanityQuiz } from '../../types/sanity';

// Get a single lesson by ID
export async function getLesson(lessonId: string): Promise<SanityLesson | null> {
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
      order
    }`;
    
    const lesson = await sanityClient.fetch(query, { lessonId });
    return lesson || null;
  } catch (error) {
    console.error('Error fetching lesson from Sanity:', error);
    return null;
  }
}

// Get lesson with all its quizzes
export async function getLessonWithQuizzes(lessonId: string): Promise<SanityLesson & { quizzes: SanityQuiz[] } | null> {
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
      order,
      "quizzes": *[_type == "quiz" && references(^._id)] | order(order_number) {
        _id,
        _type,
        title,
        description,
        lesson,
        order_number,
        questions
      }
    }`;
    
    const lesson = await sanityClient.fetch(query, { lessonId });
    return lesson || null;
  } catch (error) {
    console.error('Error fetching lesson with quizzes from Sanity:', error);
    return null;
  }
}
