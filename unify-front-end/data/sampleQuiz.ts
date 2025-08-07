import { Quiz } from '@/types/quiz';

const sampleQuiz: Quiz = {
  id: 'budgeting-basics', // should be a number
  title: 'Budgeting Basics Quiz',
  questions: [
    {
      question: 'What is the primary purpose of a budget?',
      options: [
        'To track all your expenses',
        'To plan and control your spending',
        'To save money for emergencies',
        'To invest in stocks',
      ],
      correctAnswer: 1,
      explanation:
        'A budget helps you plan your income and expenses, allowing you to control your spending and achieve financial goals.',
    },
    {
      question: 'What percentage of your income should you typically save?',
      options: ['5-10%', '10-20%', '20-30%', '30-50%'],
      correctAnswer: 1,
      explanation:
        'Financial experts generally recommend saving 10-20% of your income, though this can vary based on your financial situation and goals.',
    },
    {
      question: 'What is compound interest?',
      options: [
        'Interest earned only on the principal amount',
        'Interest earned on both principal and accumulated interest',
        'A type of loan interest',
        'Interest paid by the government',
      ],
      correctAnswer: 1,
      explanation:
        'Compound interest is interest earned on both the initial principal and the accumulated interest from previous periods, allowing your money to grow exponentially over time.',
    },
    {
      question: 'What is diversification in investing?',
      options: [
        'Putting all your money in one stock',
        'Spreading investments across different assets',
        'Investing only in bonds',
        'Keeping all money in a savings account',
      ],
      correctAnswer: 1,
      explanation:
        'Diversification reduces risk by spreading investments across different asset classes, sectors, and geographic regions.',
    },
  ],
};

export default sampleQuiz;
