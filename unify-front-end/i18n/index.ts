import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

import en from './locales/en/translation.json';
import vi from './locales/vi/translation.json';
import es from './locales/es/translation.json';
import hi from './locales/hi/translation.json';

export const SUPPORTED_LANGUAGES = {
  en: 'English',
  vi: 'Tiếng Việt',
  es: 'Español',
  hi: 'हिन्दी',
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

const LANGUAGE_STORAGE_KEY = 'user_preferred_language';

async function getStoredLanguage(): Promise<SupportedLanguage> {
  try {
    const stored = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored && stored in SUPPORTED_LANGUAGES) {
      return stored as SupportedLanguage;
    }
  } catch {}

  const deviceLang = Localization.getLocales()[0]?.languageCode ?? 'en';
  if (deviceLang in SUPPORTED_LANGUAGES) {
    return deviceLang as SupportedLanguage;
  }
  return 'en';
}

export async function setStoredLanguage(lang: SupportedLanguage) {
  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  await i18n.changeLanguage(lang);
}

const initI18n = async () => {
  const lng = await getStoredLanguage();

  await i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      vi: { translation: vi },
      es: { translation: es },
      hi: { translation: hi },
    },
    lng,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    compatibilityJSON: 'v3',
    react: {
      useSuspense: false,
    },
  });
};

initI18n();

export default i18n;
