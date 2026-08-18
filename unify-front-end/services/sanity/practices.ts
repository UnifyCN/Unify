import { sanityClient } from '../../sanity-custom';
import { SanityPractice } from '../../types/sanity';
import {
  BASE_LANGUAGE_FILTER,
  i18nOverlay,
  mergeI18nOverlay,
  type SanityLanguage,
  type WithI18n,
} from './i18n';

/** Sanity IDs: alphanumeric, hyphens, underscores; 1–128 chars to prevent GROQ injection. */
function isValidSanityId(id: string): boolean {
  return (
    typeof id === 'string' &&
    id.length >= 1 &&
    id.length <= 128 &&
    /^[a-zA-Z0-9_-]+$/.test(id)
  );
}

const QUESTION_FIELDS = `questions[] | order(order_number asc) {
    _key,
    question_type,
    question_text,
    options[] { _key, text, value, is_correct, explanation },
    matching_pairs[] { _key, left_item, right_item, explanation },
    correct_answer { value, explanation, points },
    order_number,
    answer_box { content, showAfterSubmit }
  }`;

const PAGE_FIELDS = `pages[] | order(order asc) {
    _key,
    title,
    order,
    instructions[] {
      ...,
      options[] { _key, text, value, is_correct, explanation },
      matching_pairs[] { _key, left_item, right_item, explanation }
    },
    answer_box { title, content, showAfterSubmit }
  }`;

const PRACTICE_BY_SUBMODULE_QUERY = `*[_type == "practice" && submodule._ref == $submoduleId && ${BASE_LANGUAGE_FILTER}] | order(order_number asc) {
  _id,
  _type,
  title,
  description,
  practice_type,
  order_number,
  "submodule": submodule-> { _id, title },
  ${QUESTION_FIELDS},
  ${PAGE_FIELDS},
  ${i18nOverlay(`title, description, ${QUESTION_FIELDS}, ${PAGE_FIELDS}`)}
}`;

const PRACTICE_BY_ID_QUERY = `*[_type == "practice" && _id == $practiceId && ${BASE_LANGUAGE_FILTER}][0] {
  _id,
  _type,
  title,
  description,
  practice_type,
  order_number,
  "submodule": submodule-> { _id, title },
  ${QUESTION_FIELDS},
  ${PAGE_FIELDS},
  ${i18nOverlay(`title, description, ${QUESTION_FIELDS}, ${PAGE_FIELDS}`)}
}`;

export async function getPracticesBySubmodule(
  submoduleId: string,
  language: SanityLanguage = 'en'
): Promise<SanityPractice[]> {
  if (!isValidSanityId(submoduleId)) {
    console.warn(
      '[practices] Invalid submoduleId rejected (GROQ injection guard):',
      submoduleId
    );
    return [];
  }
  try {
    const result = await sanityClient.fetch<WithI18n<SanityPractice>[]>(
      PRACTICE_BY_SUBMODULE_QUERY,
      {
        submoduleId,
        lang: language,
      }
    );
    return Array.isArray(result) ? result.map(mergeI18nOverlay) : [];
  } catch (error) {
    console.error('Error fetching practices by submodule from Sanity:', error);
    throw error;
  }
}

export async function getPracticeById(
  practiceId: string,
  language: SanityLanguage = 'en'
): Promise<SanityPractice | null> {
  if (!isValidSanityId(practiceId)) {
    console.warn(
      '[practices] Invalid practiceId rejected (GROQ injection guard):',
      practiceId
    );
    return null;
  }
  try {
    const result = await sanityClient.fetch<WithI18n<SanityPractice> | null>(
      PRACTICE_BY_ID_QUERY,
      {
        practiceId,
        lang: language,
      }
    );
    return result && !Array.isArray(result) ? mergeI18nOverlay(result) : null;
  } catch (error) {
    console.error('Error fetching practice by ID from Sanity:', error);
    return null;
  }
}
