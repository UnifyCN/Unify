import { supabase } from '@/lib/supabase';
import { PostData } from '@/types/feeds/post';
import { PostDto } from '@/types/feeds/postDto';
import { transformPostDto } from '@/utils/postTransform';

export const getPostById = async (postId: number): Promise<PostData | null> => {
  const { data, error } = await supabase
    .from('posts')
    .select(
      `
      id,
      title,
      content,
      created_at,
      user_id,
      group_id,
      is_pinned,
      pinned_at,
      pinned_by,
      users!user_id(
        id,
        username,
        profile_picture_url
      ),
      groups!group_id(
        id,
        group_name
      ),
      post_image_urls
    `
    )
    .eq('id', postId)
    .single();

  if (error || !data) {
    return null;
  }

  const user = Array.isArray(data.users) ? data.users[0] : data.users;
  if (!user) {
    return null;
  }

  const group = Array.isArray(data.groups) ? data.groups[0] : data.groups;

  const dto: PostDto = {
    id: data.id,
    title: data.title,
    content: data.content,
    created_at: data.created_at,
    user_id: data.user_id,
    group_id: data.group_id,
    is_pinned: data.is_pinned ?? false,
    pinned_at: data.pinned_at ?? null,
    pinned_by: data.pinned_by ?? null,
    users: user,
    groups: group ?? null,
    post_image_urls: data.post_image_urls ?? null,
  };

  return transformPostDto(dto);
};
