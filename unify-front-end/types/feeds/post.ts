import { User } from '@/types/user';

// Base post data (from feed queries)
export type PostData = {
  id: number;
  user: User;
  group?: string;
  userReply?: string;
  time: string;
  title: string;
  content: string;
  pictures?: React.FC[];
};

// Feed response type
export type PostResponse = {
  posts: PostData[];
  next_cursor?: string;
};
