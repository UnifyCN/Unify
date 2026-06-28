import {
  reportDiscussion,
  reportDiscussionReply,
} from '@/services/discussions/reportDiscussion';
import { useAnalytics } from '@/utils/analytics';
import { useMutation } from '@tanstack/react-query';

export const useMutateReportDiscussion = () => {
  const { trackReportSubmitted } = useAnalytics();

  return useMutation({
    mutationFn: async ({
      discussionId,
      replyId,
      reason,
    }: {
      discussionId?: string;
      replyId?: string;
      reason: string;
    }) => {
      if (discussionId) {
        return reportDiscussion(discussionId, reason);
      }
      if (replyId) {
        return reportDiscussionReply(replyId, reason);
      }
      throw new Error('Missing discussionId or replyId');
    },
    onSuccess: (_, { discussionId, replyId }) => {
      trackReportSubmitted(
        discussionId ? 'discussion' : 'discussion_reply'
      );
    },
    onError: err => {
      console.error('Report discussion mutation error:', err);
    },
  });
};
