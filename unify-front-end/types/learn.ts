// New types for the updated schema without stages

export interface SubmoduleIntro {
  id: string;
  submodule_id: string;
  order_num: number;
  content_type: string;
  content: SubmoduleIntroContent;
}

export interface SubmoduleIntroContent {
  title: string;
  sections: SubmoduleIntroSection[];
}

export interface SubmoduleIntroSection {
  type: 'text' | 'list' | 'image' | 'image_placeholder';
  content?: SubmoduleIntroTextContent[];
  items?: string[] | SubmoduleIntroListItem[];
  title?: string;
  alt?: string;
  url?: string | null;
  placeholder?: boolean;
}

export interface SubmoduleIntroTextContent {
  text: string;
  bold?: boolean;
}

export interface SubmoduleIntroListItem {
  term: string;
  definition: string;
}

export interface Lesson {
  lesson_id: string;
  submodule_id: string;
  title: string;
  description?: string;
  order_number: string;
  pages: LessonPage[];
}

export interface LessonPage {
  page_id: string;
  lesson_id: string;
  title: string;
  order_number: number;
  contents: LessonPageContent[];
}

export interface LessonPageContent {
  content_id: string;
  page_id: string;
  content_type: 'rich_text' | 'bullet_points' | 'image' | 'dropdown' | 'input' | 'large_text_box' | 'mid_text_box' | 'example_box';
  order_number: number;
  content: any;
}

export type LessonType = 'flashcards' | 'dropdown' | 'video' | 'other';

export interface SubmoduleLessonsData {
  submodule_id: string;
  submodule_title: string;
  submodule_description: string;
  progress_percent: number;
  is_completed: boolean;
  total_lessons: number;
  completed_lessons: number;
  lessons: Lesson[];
}

export interface SubmoduleInfo {
  id: string;
  title: string;
  description: string;
  order_num: number;
  module_id: string;
  progress_percent: number;
  is_completed: boolean;
  total_lessons: number;
  completed_lessons: number;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  total_submodules: number;
  completed_submodules: number;
  progress_percent: number;
  is_completed: boolean;
}

// Quiz types
export interface Quiz {
  quiz_id: string;
  lesson_id: string;
  title: string;
  description?: string;
  passing_score: number;
  order_number: number;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question_type: 'mcq_single';
  question_text: string;
  options: QuizOption[];
  correct_answer: string;
  order_num: number;
}

export interface QuizOption {
  id: string;
  content: QuizOptionContent[];
}

export interface QuizOptionContent {
  text: string;
  bold?: boolean;
  italic?: boolean;
}

export interface QuizQuestionContent {
  type: 'text';
  content: QuizOptionContent[];
}

export interface QuizData {
  quiz: Quiz;
  questions: QuizQuestion[];
}
