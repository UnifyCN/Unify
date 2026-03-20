export interface PostDto {
  id: number;
  title: string;
  content: string;
  like_count?: number | null;
  comment_count?: number | null;
  created_at: string;
  user_id: number;
  group_id: number | null;
  is_pinned?: boolean;
  pinned_at?: string | null;
  pinned_by?: string | null;
  users: {
    id: number;
    username: string;
    profile_picture_url: string | null;
  };
  groups: {
    id: number;
    group_name: string;
  } | null;
  post_image_urls: string[] | null;
}
