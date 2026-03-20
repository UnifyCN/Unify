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
  isPinned?: boolean;
  post_image_urls?: string[];
  likeCount?: number;
  commentCount?: number;
  isLiked?: boolean;
  isSaved?: boolean;
};
