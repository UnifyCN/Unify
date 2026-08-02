export function buildResponseLanguageDirective(responseLanguage?: string): string {
  if (!responseLanguage || responseLanguage === 'en') return '';

  const normalized = responseLanguage.toLowerCase();
  const languageName = {
    vi: 'Vietnamese',
    es: 'Spanish',
    hi: 'Hindi',
  }[normalized];

  if (!languageName) return '';

  return `\n\nRESPONSE LANGUAGE:\nRespond in ${languageName} only. Do not switch to English.`;
}

export function buildLessonContextBlock(lessonContext?: string): string {
  if (!lessonContext) return '';

  const sanitized = lessonContext.trim().replace(/\s+/g, ' ');
  if (!sanitized) return '';

  return `\n\nLESSON CONTEXT:\nThe user is asking within the lesson context: ${sanitized}`;
}
