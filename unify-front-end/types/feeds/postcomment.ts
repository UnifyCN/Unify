// Base comment data (from feed queries)
export type PostCommentData = {
  id: number;
  user_id: number;
  post_id: number;
  content: string;
  parent_comment_id: number | null;
  created_at: string;
  username: string;
  profilePictureUrl?: string;
  like_count: number;
};

// Feed response type
export type PostCommentResponse = {
  comments: PostCommentData[];
  next_cursor?: string;
};
