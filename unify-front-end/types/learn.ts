export type ModuleProgressStatus = 'not_started' | 'in_progress' | 'completed';

export interface PersonalizedModule {
  sanity_id: string;
  title: string;
  score: number;
  progress: ModuleProgressStatus;
  completed_at: string | null;
  why_tag: string;
}

export interface PersonalizeLearnResponse {
  modules: PersonalizedModule[];
}
