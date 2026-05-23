import { supabase } from '@/lib/supabase';
import { SupportedLanguage } from '@/i18n';

export async function translateContent(
  text: string,
  targetLanguage: SupportedLanguage
): Promise<string> {
  let data, error;
  try {
    const result = await supabase.functions.invoke('translate-post', {
      body: { text, targetLanguage },
    });
    data = result.data;
    error = result.error;
  } catch (err: any) {
    throw new Error(
      `Failed to reach translation service: ${err.message || err}`
    );
  }

  if (error) {
    throw new Error(error.message || 'Translation failed');
  }

  if (!data?.translatedText) {
    throw new Error('No translation returned');
  }

  return data.translatedText;
}
