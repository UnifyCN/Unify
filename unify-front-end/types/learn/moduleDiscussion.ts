export type ModuleDiscussionData = {
  id: string;
  module_id: string;
  submodule_id: string | null;
  lesson_id: string | null;
  author_id: string;
  body: string;
  like_count: number;
  reply_count: number;
  created_at: string;
  username: string;
  profilePictureUrl?: string;
};

export type DiscussionReplyData = {
  id: string;
  discussion_id: string;
  author_id: string;
  body: string;
  like_count: number;
  created_at: string;
  username: string;
  profilePictureUrl?: string;
};

export type DiscussionMetadata = {
  discussionId: string;
  likeCount: number;
  replyCount: number;
  isLiked: boolean;
};

export type DiscussionReplyMetadata = {
  replyId: string;
  likeCount: number;
  isLiked: boolean;
};

export type ModuleDiscussionStats = {
  discussionCount: number;
  participantCount: number;
};

export type DiscussionSort = 'recent' | 'liked';
