import {
  likeDiscussion,
  likeDiscussionReply,
  unlikeDiscussion,
  unlikeDiscussionReply,
} from '@/services/discussions/likeDiscussion';
import { useMutation, useQueryClient } from '@tanstack/react-query';

type LikeTarget =
  | { type: 'discussion'; id: string }
  | { type: 'reply'; id: string };

export const useMutateLikeDiscussion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      target,
      isLiked,
    }: {
      target: LikeTarget;
      isLiked: boolean;
    }) => {
      const metadataKey =
        target.type === 'discussion'
          ? 'discussion-metadata'
          : 'discussion-reply-metadata';

      queryClient.setQueriesData(
        { queryKey: [metadataKey] },
        (oldData: Record<string, any> | undefined) => {
          if (!oldData?.[target.id]) return oldData;

          const current = oldData[target.id];
          return {
            ...oldData,
            [target.id]: {
              ...current,
              isLiked: !isLiked,
              likeCount: (current.likeCount ?? current.like_count ?? 0) + (isLiked ? -1 : 1),
            },
          };
        }
      );

      if (target.type === 'discussion') {
        return isLiked
          ? unlikeDiscussion(target.id)
          : likeDiscussion(target.id);
      }

      return isLiked
        ? unlikeDiscussionReply(target.id)
        : likeDiscussionReply(target.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discussion-metadata'] });
      queryClient.invalidateQueries({
        queryKey: ['discussion-reply-metadata'],
      });
      queryClient.invalidateQueries({ queryKey: ['module-discussions'] });
      queryClient.invalidateQueries({ queryKey: ['discussion-replies'] });
    },
    onError: err => {
      console.error('Error liking/unliking discussion:', err);
    },
  });
};
