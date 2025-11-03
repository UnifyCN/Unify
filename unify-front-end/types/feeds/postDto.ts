export interface PostDto {
  id: number;
  title: string;
  content: string;
  created_at: string;
  user_id: number;
  group_id: number;
  users: {
    id: number;
    username: string;
    profile_picture_url: string | null;
  };
  groups: {
    id: number;
    group_name: string;
  };
}
