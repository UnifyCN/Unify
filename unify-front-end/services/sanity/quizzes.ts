import { sanityClient } from '../../sanity-custom';
import { SanityQuiz } from '../../types/sanity';

// Get all quizzes for a lesson
export async function getLessonQuizzes(lessonId: string): Promise<SanityQuiz[]> {
  try {
    const query = `*[_type == "quiz" && lesson._ref == $lessonId] | order(order_number) {
      _id,
      _type,
      title,
      description,
      lesson,
      order_number,
      questions
    }`;
    
    const quizzes = await sanityClient.fetch(query, { lessonId });
    return quizzes || [];
  } catch (error) {
    console.error('Error fetching lesson quizzes from Sanity:', error);
    return [];
  }
}

// Get a single quiz by ID
export async function getQuiz(quizId: string): Promise<SanityQuiz | null> {
  try {
    const query = `*[_type == "quiz" && _id == $quizId][0] {
      _id,
      _type,
      title,
      description,
      lesson,
      order_number,
      questions
    }`;
    
    const quiz = await sanityClient.fetch(query, { quizId });
    return quiz || null;
  } catch (error) {
    console.error('Error fetching quiz from Sanity:', error);
    return null;
  }
}

// Get quiz questions (questions are embedded in the quiz document)
export async function getQuizQuestions(quizId: string): Promise<any[]> {
  try {
    const query = `*[_type == "quiz" && _id == $quizId][0].questions | order(order_number)`;
    
    const questions = await sanityClient.fetch(query, { quizId });
    return questions || [];
  } catch (error) {
    console.error('Error fetching quiz questions from Sanity:', error);
    return [];
  }
}
