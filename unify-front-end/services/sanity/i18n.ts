export const SANITY_LANGUAGES = [
  'en',
  'vi',
  'es',
  'hi',
  'ar',
  'fr-CA',
] as const;

export type SanityLanguage = (typeof SANITY_LANGUAGES)[number];

/** Resolve regional UI locales to available Sanity translation keys. */
export function normalizeSanityLanguage(
  language: string | null | undefined
): SanityLanguage {
  const normalized = language?.trim().toLowerCase();
  if (!normalized) return 'en';
  if (normalized === 'fr' || normalized.startsWith('fr-')) return 'fr-CA';
  if (normalized === 'vi' || normalized.startsWith('vi-')) return 'vi';
  if (normalized === 'es' || normalized.startsWith('es-')) return 'es';
  if (normalized === 'hi' || normalized.startsWith('hi-')) return 'hi';
  if (normalized === 'ar' || normalized.startsWith('ar-')) return 'ar';
  return 'en';
}

export type WithI18n<T> = T & {
  i18n?: { [Key in keyof T]?: T[Key] | null } | null;
};

/** Overlay translated fields while preserving the English document identity. */
export function mergeI18nOverlay<T extends object>(row: WithI18n<T>): T {
  const { i18n, ...base } = row;
  if (!i18n) return base as unknown as T;

  const overlay = Object.fromEntries(
    Object.entries(i18n).filter(
      ([key, value]) =>
        key !== '_id' &&
        key !== '_type' &&
        value !== null &&
        value !== undefined
    )
  ) as Partial<T>;

  return { ...(base as unknown as T), ...overlay };
}

/** Filter listings to English/legacy docs so translations cannot duplicate rows. */
export const BASE_LANGUAGE_FILTER = '(language == "en" || !defined(language))';

export const i18nOverlay = (fields: string) =>
  `"i18n": select($lang != "en" => *[_type == "translation.metadata" && references(^._id)][0].translations[_key == $lang][0].value->{ ${fields} }, null)`;
