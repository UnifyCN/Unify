import { User } from '@/types/user';

// Base post data (from feed queries)
export type PostData = {
  id: number;
  user: User;
  userReply?: string;
  time: string;
  description: string;
  pictures?: React.FC[];
  groupId: number;
};

// Feed response type
export type PostResponse = {
  posts: PostData[];
  next_cursor?: string;
};
