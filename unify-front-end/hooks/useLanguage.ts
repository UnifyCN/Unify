import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  SUPPORTED_LANGUAGES,
  setStoredLanguage,
  type SupportedLanguage,
} from '@/i18n';
import { supabase } from '@/lib/supabase';

export function useLanguage() {
  const { i18n } = useTranslation();

  const currentLanguage = (i18n.language || 'en') as SupportedLanguage;

  const changeLanguage = useCallback(
    async (lang: SupportedLanguage) => {
      await setStoredLanguage(lang);

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('user_onboarding_profiles')
            .update({ preferred_language: lang })
            .eq('id', user.id);
        }
      } catch {
        // Language is already persisted locally via AsyncStorage;
        // Supabase sync is best-effort.
      }
    },
    []
  );

  return {
    currentLanguage,
    changeLanguage,
    supportedLanguages: SUPPORTED_LANGUAGES,
  };
}
