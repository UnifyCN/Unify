// services/comments/getPostComments.ts
import { supabase } from '@/lib/supabase';

export interface PostComment {
  id: number;
  user_id: string;
  post_id: number;
  content: string;
  parent_comment_id: number | null;
  created_at: string;
  username?: string;
  like_count: number;
}

export const getPostComments = async (postId: number): Promise<PostComment[]> => {
  try {
    const { data, error } = await supabase
        .from('post_comments')
        .select(`
            id,
            user_id,
            post_id,
            content,
            parent_comment_id,
            created_at,
            like_count
        `)
        .eq('post_id', Number(postId))
        .order('created_at', { ascending: true });


    if (error) throw error;

    return data.map((comment: any) => ({
      id: comment.id,
      user_id: comment.user_id,
      post_id: postId,
      content: comment.content,
      parent_comment_id: comment.parent_comment_id,
      created_at: comment.created_at,
      username: comment.username,
      like_count: comment.like_count
    }));
  } catch (err) {
    console.error('Error fetching comments:', err);
    throw err;
  }
};
