jest.mock('@/sanity-custom', () => ({
  sanityClient: { fetch: jest.fn() },
}));

import { sanityClient } from '@/sanity-custom';
import { getModuleWithSubmodules } from '@/services/sanity/modules';
import { getSubmoduleWithLessons } from '@/services/sanity/submodules';
import { getPracticesBySubmodule } from '@/services/sanity/practices';
import { getLessonQuizzes } from '@/services/sanity/quizzes';
import { getTaskById } from '@/services/sanity/tasks';
import { getChecklistByPersonaAndStage } from '@/services/sanity/checklist';

const mockFetch = sanityClient.fetch as jest.Mock;

describe('translated Sanity service contracts', () => {
  beforeEach(() => mockFetch.mockReset());

  it('preserves module, submodule, lesson and quiz identities', async () => {
    mockFetch.mockResolvedValue({
      _id: 'module-base',
      title: 'Module',
      i18n: { _id: 'module-es', title: 'Módulo' },
      submodules: [
        {
          _id: 'submodule-base',
          title: 'Section',
          i18n: { _id: 'submodule-es', title: 'Sección' },
          lessons: [
            {
              _id: 'lesson-base',
              title: 'Lesson',
              i18n: { _id: 'lesson-es', title: 'Lección' },
              quizzes: [
                {
                  _id: 'quiz-base',
                  title: 'Quiz',
                  i18n: { _id: 'quiz-es', title: 'Prueba' },
                },
              ],
            },
          ],
        },
      ],
    });

    const result = await getModuleWithSubmodules('module-base', 'es');
    expect(result).toMatchObject({
      _id: 'module-base',
      title: 'Módulo',
      submodules: [
        {
          _id: 'submodule-base',
          title: 'Sección',
          lessons: [
            {
              _id: 'lesson-base',
              title: 'Lección',
              quizzes: [{ _id: 'quiz-base', title: 'Prueba' }],
            },
          ],
        },
      ],
    });
    expect(mockFetch.mock.calls[0][1]).toEqual({
      moduleId: 'module-base',
      lang: 'es',
    });
  });

  it('preserves submodule lesson keys through its direct service', async () => {
    mockFetch.mockResolvedValue({
      _id: 'submodule-base',
      title: 'Section',
      intro_pages: [{ _key: 'intro-1', title: 'Base intro' }],
      i18n: {
        _id: 'submodule-fr',
        title: 'Section française',
        intro_pages: [{ _key: 'intro-1', title: 'Introduction' }],
      },
      lessons: [{ _id: 'lesson-base', title: 'Base lesson' }],
    });

    const result = await getSubmoduleWithLessons('submodule-base', 'fr-CA');
    expect(result?._id).toBe('submodule-base');
    expect(result?.intro_pages?.[0]).toMatchObject({
      _key: 'intro-1',
      title: 'Introduction',
    });
    expect(result?.lessons?.[0]._id).toBe('lesson-base');
  });

  it('merges practice questions/options without altering saved-answer keys', async () => {
    mockFetch.mockResolvedValue([
      {
        _id: 'practice-base',
        title: 'Practice',
        questions: [
          {
            _key: 'question-1',
            question_text: 'Base question',
            options: [
              { _key: 'option-a', text: 'Base A', value: 'a' },
              { _key: 'option-b', text: 'Base B', value: 'b' },
            ],
          },
        ],
        i18n: {
          _id: 'practice-es',
          title: 'Práctica',
          questions: [
            {
              _key: 'question-1',
              question_text: 'Pregunta',
              options: [{ _key: 'option-a', text: 'Opción A' }],
            },
          ],
        },
      },
    ]);

    const [result] = await getPracticesBySubmodule('submodule-base', 'es');
    expect(result._id).toBe('practice-base');
    expect(result.questions?.[0]._key).toBe('question-1');
    expect(result.questions?.[0].options).toEqual([
      { _key: 'option-a', text: 'Opción A', value: 'a' },
      { _key: 'option-b', text: 'Base B', value: 'b' },
    ]);
    expect(mockFetch.mock.calls[0][0]).toContain('language == "en"');
  });

  it('keeps quiz question and option identities stable', async () => {
    mockFetch.mockResolvedValue([
      {
        _id: 'quiz-base',
        questions: [
          {
            _key: 'question-1',
            question_text: 'Base',
            options: [{ _key: 'option-a', text: 'Base option' }],
          },
        ],
        i18n: {
          _id: 'quiz-hi',
          questions: [
            {
              _key: 'question-1',
              question_text: 'अनुवाद',
              options: [{ _key: 'option-a', text: 'विकल्प' }],
            },
          ],
        },
      },
    ]);

    const [result] = await getLessonQuizzes('lesson-base', 'hi');
    expect(result._id).toBe('quiz-base');
    expect(result.questions[0]._key).toBe('question-1');
    expect(result.questions[0].options?.[0]).toMatchObject({
      _key: 'option-a',
      text: 'विकल्प',
    });
  });

  it('overlays task and checklist text while retaining persistence ids', async () => {
    mockFetch
      .mockResolvedValueOnce({
        _id: 'task-base',
        title: 'Task',
        content: [{ _key: 'block-1', text: 'Base' }],
        i18n: {
          _id: 'task-ar',
          title: 'مهمة',
          content: [{ _key: 'block-1', text: 'محتوى' }],
        },
      })
      .mockResolvedValueOnce([
        {
          _id: 'checklist-base',
          title: 'Checklist',
          i18n: { _id: 'checklist-ar', title: 'قائمة' },
        },
      ]);

    const task = await getTaskById('task-base', 'ar');
    const [checklist] = await getChecklistByPersonaAndStage(
      'skilled_worker',
      'not_arrived',
      { language: 'ar', skipCache: true }
    );
    expect(task).toMatchObject({
      _id: 'task-base',
      title: 'مهمة',
      content: [{ _key: 'block-1', text: 'محتوى' }],
    });
    expect(checklist).toMatchObject({
      _id: 'checklist-base',
      title: 'قائمة',
    });
  });
});
