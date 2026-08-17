import { useTranslation } from 'react-i18next';
import { normalizeSanityLanguage } from '@/services/sanity/i18n';

/** The content locale used by Sanity fetches and cache keys. */
export function useSanityLanguage() {
  const { i18n } = useTranslation();
  return normalizeSanityLanguage(i18n.resolvedLanguage ?? i18n.language);
}
