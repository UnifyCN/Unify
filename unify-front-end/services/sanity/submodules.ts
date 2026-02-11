import { sanityClient } from '../../sanity-custom';
import { SanitySubmodule, SanityLessonWithQuizzes } from '../../types/sanity';

// Get submodule with all its lessons
export async function getSubmoduleWithLessons(
  submoduleId: string
): Promise<(SanitySubmodule & { lessons: SanityLessonWithQuizzes[] }) | null> {
  try {
    const query = `*[_type == "submodule" && _id == $submoduleId][0] {
      _id,
      _type,
      title,
      description,
      module,
      intro_pages,
      order,
      "lessons": *[_type == "lesson" && references(^._id)] | order(order) {
        _id,
        _type,
        title,
        slug,
        description,
        submodule,
        order,
        "lesson_page_count": count(pages),
        "activity_page_count": count(activity_pages),
        "ending_page_count": count(ending_pages),
        "quizzes": *[_type == "quiz" && references(^._id)] | order(order_number) {
          _id,
          _type,
          title,
          order_number,
          "question_count": count(questions)
        }
      }
    }`;

    const submodule = await sanityClient.fetch(query, { submoduleId });
    if (!submodule || Array.isArray(submodule)) return null;
    return submodule as SanitySubmodule & {
      lessons: SanityLessonWithQuizzes[];
    };
  } catch (error) {
    console.error('Error fetching submodule with lessons from Sanity:', error);
    return null;
  }
}
