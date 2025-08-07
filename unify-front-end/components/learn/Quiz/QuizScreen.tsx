import React, { useState } from 'react';
import QuizContainer from '@/components/learn/Quiz/QuizContainer';
import QuizSuccess from '@/components/learn/Quiz/QuizSuccess';
import QuizFailed from '@/components/learn/Quiz/QuizFailed';
import { QuizStage, QuizResults, Quiz } from '@/types/quiz';

interface QuizScreenProps {
  quiz: Quiz;
  onComplete: (passed: boolean) => void;
}

const QuizScreen = ({ quiz, onComplete }: QuizScreenProps) => {
  const [quizState, setQuizState] = useState<QuizStage>('quiz');
  const [results, setResults] = useState<QuizResults | null>(null);

  const handleSuccess = (quizResults: QuizResults) => {
    setResults(quizResults);
    setQuizState('success');
  };

  const handleFailed = (quizResults: QuizResults) => {
    setResults(quizResults);
    setQuizState('failed');
  };

  const handleRetry = () => {
    setQuizState('quiz');
    setResults(null);
  };

  const handleContinue = () => {
    onComplete(true);
  };

  if (quizState === 'success' && results) {
    return (
      <QuizSuccess
        results={results}
        onRetry={handleRetry}
        onContinue={handleContinue}
      />
    );
  }

  if (quizState === 'failed' && results) {
    return <QuizFailed results={results} onRetry={handleRetry} />;
  }

  return (
    <QuizContainer
      quiz={quiz}
      onSuccess={handleSuccess}
      onFailed={handleFailed}
    />
  );
};

export default QuizScreen;
