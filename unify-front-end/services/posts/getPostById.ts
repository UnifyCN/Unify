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
      users!user_id(
        id,
        username,
        profile_picture_url
      ),
      groups!group_id(
        id,
        group_name
      )
    `
    )
    .eq('id', postId)
    .single();

  if (error || !data) {
    return null;
  }

  return transformPostDto(data as unknown as PostDto);
};
