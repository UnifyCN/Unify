import { User } from '@/types/user';
import { ReactNode } from 'react';

// Base comment data (from feed queries)
export type CommentData = {
  id: number;
  user: User;
  time: string;
  content: string;
};

// Feed response type
export type CommentResponse = {
  comments: CommentData[];
  next_cursor?: string;
};
