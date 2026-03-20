import { supabase } from '@/lib/supabase';
import { PostData } from '@/types/feeds/post';

export interface PostMetadataRow {
  post_id: number;
  like_count: number | null;
  comment_count: number | null;
  is_liked: boolean | null;
  is_saved: boolean | null;
}

export const getPostMetadataBatch = async (
  postIds: number[]
): Promise<Record<number, PostMetadataRow>> => {
  const normalizedPostIds = Array.from(new Set(postIds)).sort((a, b) => a - b);

  if (normalizedPostIds.length === 0) {
    return {};
  }

  const { data, error } = await supabase.rpc('get_post_metadata_batch', {
    post_ids: normalizedPostIds,
  });

  if (error) {
    throw error;
  }

  const metadataMap: Record<number, PostMetadataRow> = {};

  normalizedPostIds.forEach(postId => {
    metadataMap[postId] = {
      post_id: postId,
      like_count: 0,
      comment_count: 0,
      is_liked: false,
      is_saved: false,
    };
  });

  for (const row of (data || []) as PostMetadataRow[]) {
    metadataMap[row.post_id] = row;
  }

  return metadataMap;
};

export const enrichPostsWithMetadata = async (
  posts: PostData[]
): Promise<PostData[]> => {
  if (posts.length === 0) {
    return posts;
  }

  const metadataMap = await getPostMetadataBatch(posts.map(post => post.id));

  return posts.map(post => {
    const metadata = metadataMap[post.id];

    if (!metadata) {
      return post;
    }

    return {
      ...post,
      likeCount: metadata.like_count ?? post.likeCount ?? 0,
      commentCount: metadata.comment_count ?? post.commentCount ?? 0,
      isLiked: metadata.is_liked ?? post.isLiked ?? false,
      isSaved: metadata.is_saved ?? post.isSaved ?? false,
    };
  });
};
