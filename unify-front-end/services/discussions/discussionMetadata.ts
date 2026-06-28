import { supabase } from '@/lib/supabase';
import {
  DiscussionMetadata,
  DiscussionReplyMetadata,
  ModuleDiscussionStats,
} from '@/types/learn/moduleDiscussion';

export const getModuleDiscussionStats = async (
  moduleId: string
): Promise<ModuleDiscussionStats> => {
  const { data, error } = await supabase.rpc('get_module_discussion_stats', {
    p_module_id: moduleId,
  });

  if (error) {
    console.error('Error fetching module discussion stats:', error);
    throw error;
  }

  const row = Array.isArray(data) ? data[0] : data;

  return {
    discussionCount: row?.discussion_count ?? 0,
    participantCount: row?.participant_count ?? 0,
  };
};

export const getDiscussionMetadataBatch = async (
  discussionIds: string[]
): Promise<Record<string, DiscussionMetadata>> => {
  if (discussionIds.length === 0) return {};

  const { data, error } = await supabase.rpc('get_discussion_metadata_batch', {
    discussion_ids: discussionIds,
  });

  if (error) {
    console.error('Error fetching discussion metadata:', error);
    throw error;
  }

  const metadata: Record<string, DiscussionMetadata> = {};

  for (const row of data ?? []) {
    metadata[row.discussion_id] = {
      discussionId: row.discussion_id,
      likeCount: row.like_count,
      replyCount: row.reply_count,
      isLiked: row.is_liked,
    };
  }

  return metadata;
};

export const getDiscussionReplyMetadataBatch = async (
  replyIds: string[]
): Promise<Record<string, DiscussionReplyMetadata>> => {
  if (replyIds.length === 0) return {};

  const { data, error } = await supabase.rpc(
    'get_discussion_reply_metadata_batch',
    { reply_ids: replyIds }
  );

  if (error) {
    console.error('Error fetching discussion reply metadata:', error);
    throw error;
  }

  const metadata: Record<string, DiscussionReplyMetadata> = {};

  for (const row of data ?? []) {
    metadata[row.reply_id] = {
      replyId: row.reply_id,
      likeCount: row.like_count,
      isLiked: row.is_liked,
    };
  }

  return metadata;
};
