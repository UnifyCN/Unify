// ─── Personalization types ────────────────────────────────────────────────────

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

// ─── Submodule intro types (used by intro/[pageNum].tsx) ─────────────────────

export interface SubmoduleIntroSection {
  type: 'text' | 'list' | 'image' | 'video' | string;
  title?: string;
  content?: Array<{ text: string; bold?: boolean; [key: string]: any }>;
  items?: Array<string | { term?: string; definition?: string; [key: string]: any }>;
  url?: string;
  alt?: string;
  [key: string]: any;
}
