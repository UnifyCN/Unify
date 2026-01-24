export type Persona =
  | 'international_student'
  | 'skilled_worker'
  | 'refugee'
  | 'other';

export type ReferralSource =
  | 'facebook_instagram'
  | 'google_search'
  | 'app_store'
  | 'friends_family'
  | 'news_article'
  | 'tiktok'
  | 'other';

export type Goal =
  | 'learn_something'
  | 'build_community'
  | 'quick_answers'
  | 'something_else';

export type LearningInterest =
  | 'documents'
  | 'employment'
  | 'finance'
  | 'housing'
  | 'pr_immigration'
  | 'healthcare'
  | 'family_kids'
  | 'transit'
  | 'other';

export type Hobby =
  | 'career_growth'
  | 'exploring_canada'
  | 'wellness'
  | 'technology'
  | 'music'
  | 'fitness'
  | 'personal_finance'
  | 'family_parenting'
  | 'education'
  | 'food_cooking'
  | 'movies';

export interface UserOnboardingProfile {
  id: string; // UUID matching auth.users.id

  // Single-select fields
  persona: Persona | null;
  persona_other: string | null;
  referral_source: ReferralSource | null;
  referral_source_other: string | null;
  arrival_date: string | null;

  // Multi-select fields
  goals: Goal[];
  goals_other: string | null;
  learning_interests: LearningInterest[];
  learning_interests_other: string | null;
  hobbies: Hobby[];

  // Preferences
  wants_reminders: boolean;

  // Metadata
  onboarding_completed: boolean;
  onboarding_completed_at: string | null; // ISO timestamp
  created_at: string;
  updated_at: string;
}

// Input type for creating/updating onboarding profile
export interface OnboardingProfileInput {
  persona?: Persona | null;
  persona_other?: string | null;
  referral_source?: ReferralSource | null;
  referral_source_other?: string | null;
  arrival_date?: string | null;
  goals?: Goal[];
  goals_other?: string | null;
  learning_interests?: LearningInterest[];
  learning_interests_other?: string | null;
  hobbies?: Hobby[];
  wants_reminders?: boolean;
  onboarding_completed?: boolean;
}
