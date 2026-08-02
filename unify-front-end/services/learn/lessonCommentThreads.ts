import type { LessonCommentRow } from '@/services/learn/lessonComments';

export type LessonCommentThreadNode<T extends LessonCommentRow = LessonCommentRow> = T & {
  replies: LessonCommentThreadNode<T>[];
};

const compareByCreatedAt = <T extends LessonCommentRow>(a: T, b: T) => {
  const aTime = new Date(a.created_at).getTime();
  const bTime = new Date(b.created_at).getTime();
  return aTime - bTime;
};

export function buildLessonCommentThreadTree<T extends LessonCommentRow>(
  comments: T[]
): LessonCommentThreadNode<T>[] {
  const byId = new Map<number, LessonCommentThreadNode<T>>();
  const roots: LessonCommentThreadNode<T>[] = [];

  comments.forEach(comment => {
    byId.set(comment.id, { ...comment, replies: [] });
  });

  comments.forEach(comment => {
    const node = byId.get(comment.id);
    if (!node) return;

    if (comment.parent_id) {
      const parent = byId.get(comment.parent_id);
      if (parent) {
        parent.replies.push(node);
      } else {
        roots.push(node);
      }
    } else {
      roots.push(node);
    }
  });

  const sortNode = (node: LessonCommentThreadNode<T>) => {
    node.replies.sort((a, b) => compareByCreatedAt(a, b));
    node.replies.forEach(sortNode);
  };

  roots.sort((a, b) => compareByCreatedAt(b, a));
  roots.forEach(sortNode);

  return roots;
}
