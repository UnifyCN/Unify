import {
  buildLessonContextBlock,
  buildResponseLanguageDirective,
} from '../../supabase/functions/_shared/companionPrompt';

describe('companion prompt helpers', () => {
  it('builds a response-language directive for supported locales', () => {
    expect(buildResponseLanguageDirective('vi')).toContain('Vietnamese');
    expect(buildResponseLanguageDirective('es')).toContain('Spanish');
  });

  it('returns no directive for English or unsupported locales', () => {
    expect(buildResponseLanguageDirective('en')).toBe('');
    expect(buildResponseLanguageDirective('ar')).toBe('');
  });

  it('sanitizes and formats lesson context', () => {
    const block = buildLessonContextBlock('  Lesson about work permits  ');
    expect(block).toContain('LESSON CONTEXT');
    expect(block).toContain('work permits');
    expect(block).not.toContain('  ');
  });
});
