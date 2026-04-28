export type Group = {
  id: number;
  name: string;
  description: string | null;
  memberCount: number;
  coverPhotoUrl: string | null;
  createdAt: string;

  score?: number;
  why_tag?: string | null;
  social_proof?: { count: number; label: string } | null;
};
