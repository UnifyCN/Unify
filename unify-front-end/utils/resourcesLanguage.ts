/** The directory chrome is localized, but organization-provided copy is not. */
export function shouldShowEnglishContentNotice(language?: string): boolean {
  if (!language) return false;
  return !language.toLowerCase().startsWith('en');
}
