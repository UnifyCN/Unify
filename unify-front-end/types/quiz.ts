export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number; // Index
  explanation: string;
}

export interface Quiz {
  id: string;
  title: string;
  questions: QuizQuestion[];
}

export type QuizStage = 'quiz' | 'success' | 'failed';

export interface QuizResults {
  correctAnswers: number;
  totalQuestions: number;
  wrongAnswers: Array<{
    question: string;
    selectedAnswer: number;
    correctAnswer: number;
    explanation: string;
  }>;
}

export interface QuizContainerProps {
  quiz: Quiz;
  onSuccess?: (results: QuizResults) => void;
  onFailed?: (results: QuizResults) => void;
}
