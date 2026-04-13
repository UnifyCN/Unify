import { supabase } from '@/lib/supabase';

/**
 * Calls the explain-term edge function to get a plain-language explanation
 * of a term or phrase from lesson content.
 */
export async function explainTerm(
  term: string,
  lessonContext?: string
): Promise<string> {
  let data, error;
  try {
    const result = await supabase.functions.invoke('explain-term', {
      body: { term, lessonContext },
    });
    data = result.data;
    error = result.error;
  } catch (err: any) {
    throw new Error(
      `Failed to reach explanation service: ${err.message || err}`
    );
  }

  if (error) {
    throw new Error(error.message || 'Failed to get explanation');
  }

  if (!data?.explanation) {
    throw new Error('No explanation available for this term');
  }

  return data.explanation;
}
