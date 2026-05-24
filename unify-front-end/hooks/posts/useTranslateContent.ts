import { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { translateContent } from '@/services/posts/translateContent';
import { SupportedLanguage } from '@/i18n';

const translationCache = new Map<string, string>();

function cacheKey(text: string, lang: string) {
  return `${lang}::${text}`;
}

export function useTranslateContent(originalText: string) {
  const { i18n } = useTranslation();
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isShowingTranslation, setIsShowingTranslation] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const targetLanguage = i18n.language as SupportedLanguage;

  const translate = useCallback(async () => {
    if (isShowingTranslation) {
      setIsShowingTranslation(false);
      return;
    }

    const key = cacheKey(originalText, targetLanguage);
    const cached = translationCache.get(key);
    if (cached) {
      setTranslatedText(cached);
      setIsShowingTranslation(true);
      return;
    }

    setIsTranslating(true);
    setError(null);

    try {
      const result = await translateContent(originalText, targetLanguage);
      translationCache.set(key, result);
      setTranslatedText(result);
      setIsShowingTranslation(true);
    } catch (err: any) {
      setError(err.message || 'Translation failed');
    } finally {
      setIsTranslating(false);
    }
  }, [originalText, targetLanguage, isShowingTranslation]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setTranslatedText(null);
    setIsShowingTranslation(false);
    setIsTranslating(false);
    setError(null);
  }, []);

  return {
    translatedText,
    isTranslating,
    isShowingTranslation,
    error,
    translate,
    reset,
    targetLanguage,
  };
}
