import { buildLessonCommentThreadTree } from '@/services/learn/lessonCommentThreads';
import type { LessonCommentRow } from '@/services/learn/lessonComments';

describe('buildLessonCommentThreadTree', () => {
  it('nests replies under the matching parent comment', () => {
    const comments: LessonCommentRow[] = [
      {
        id: 1,
        lesson_id: 'lesson-1',
        module_id: 'module-1',
        submodule_id: 'submodule-1',
        page_num: 2,
        user_id: 'u-1',
        content: 'Top level',
        created_at: '2026-08-02T10:00:00.000Z',
        parent_id: null,
      },
      {
        id: 2,
        lesson_id: 'lesson-1',
        module_id: 'module-1',
        submodule_id: 'submodule-1',
        page_num: 2,
        user_id: 'u-2',
        content: 'Reply',
        created_at: '2026-08-02T10:05:00.000Z',
        parent_id: 1,
      },
      {
        id: 3,
        lesson_id: 'lesson-1',
        module_id: 'module-1',
        submodule_id: 'submodule-1',
        page_num: 2,
        user_id: 'u-3',
        content: 'Nested reply',
        created_at: '2026-08-02T10:06:00.000Z',
        parent_id: 2,
      },
    ];

    const tree = buildLessonCommentThreadTree(comments);

    expect(tree).toHaveLength(1);
    expect(tree[0].replies).toHaveLength(1);
    expect(tree[0].replies[0].replies).toHaveLength(1);
    expect(tree[0].replies[0].replies[0].content).toBe('Nested reply');
  });
});
