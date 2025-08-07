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
