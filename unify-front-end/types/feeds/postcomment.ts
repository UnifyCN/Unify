// Base comment data (from feed queries).
// post_comments.user_id is a uuid (FK to users.id) — string at runtime,
// even though earlier code mistyped it as number.
export type PostCommentData = {
  id: number;
  user_id: string;
  post_id: number;
  content: string;
  parent_comment_id: number | null;
  created_at: string;
  username: string;
  profilePictureUrl?: string;
  like_count: number;
};
