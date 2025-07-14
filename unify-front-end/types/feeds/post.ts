import { User } from "@/types/user";

// Base post data (from feed queries)
export type PostData = {
  id: number;
  user: User;
  userReply?: string;
  time: string;
  description: string;
  pictures?: React.FC[];
  comments: number;
  saved: boolean;
};

// Like data (from individual post queries)
export type PostLikes = {
  likeCount: number;
  userLiked: boolean;
};

// Combined post with like data
export type Post = PostData & PostLikes;

// Feed response type
export type PostResponse = {
  posts: PostData[];
  next_cursor?: string;
};