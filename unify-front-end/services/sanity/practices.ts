import { sanityClient } from '../../sanity-custom';
import { SanityPractice } from '../../types/sanity';

/** Sanity IDs: alphanumeric, hyphens, underscores; 1–128 chars to prevent GROQ injection. */
function isValidSanityId(id: string): boolean {
  return (
    typeof id === 'string' &&
    id.length >= 1 &&
    id.length <= 128 &&
    /^[a-zA-Z0-9_-]+$/.test(id)
  );
}

const PRACTICE_BY_SUBMODULE_QUERY = `*[_type == "practice" && submodule._ref == $submoduleId] | order(order_number asc) {
  _id,
  _type,
  title,
  description,
  practice_type,
  order_number,
  "submodule": submodule-> { _id, title },
  questions[] {
    _key,
    question_type,
    question_text,
    options[] { _key, text, value, is_correct, explanation },
    matching_pairs[] { _key, left_item, right_item, explanation },
    correct_answer { value, explanation, points },
    order_number,
    answer_box { content, showAfterSubmit }
  },
  pages[] {
    _key,
    title,
    order,
    instructions[],
    answer_box { title, content, showAfterSubmit }
  }
}`;

const PRACTICE_BY_ID_QUERY = `*[_type == "practice" && _id == $practiceId][0] {
  _id,
  _type,
  title,
  description,
  practice_type,
  order_number,
  "submodule": submodule-> { _id, title },
  questions[] {
    _key,
    question_type,
    question_text,
    options[] { _key, text, value, is_correct, explanation },
    matching_pairs[] { _key, left_item, right_item, explanation },
    correct_answer { value, explanation, points },
    order_number,
    answer_box { content, showAfterSubmit }
  },
  pages[] {
    _key,
    title,
    order,
    instructions[],
    answer_box { title, content, showAfterSubmit }
  }
}`;

export async function getPracticesBySubmodule(
  submoduleId: string
): Promise<SanityPractice[]> {
  if (!isValidSanityId(submoduleId)) {
    console.warn(
      '[practices] Invalid submoduleId rejected (GROQ injection guard):',
      submoduleId
    );
    return [];
  }
  try {
    const result = await sanityClient.fetch(PRACTICE_BY_SUBMODULE_QUERY, {
      submoduleId,
    });
    return Array.isArray(result) ? result : [];
  } catch (error) {
    console.error('Error fetching practices by submodule from Sanity:', error);
    return [];
  }
}

export async function getPracticeById(
  practiceId: string
): Promise<SanityPractice | null> {
  if (!isValidSanityId(practiceId)) {
    console.warn(
      '[practices] Invalid practiceId rejected (GROQ injection guard):',
      practiceId
    );
    return null;
  }
  try {
    const result = await sanityClient.fetch(PRACTICE_BY_ID_QUERY, {
      practiceId,
    });
    return result && !Array.isArray(result) ? result : null;
  } catch (error) {
    console.error('Error fetching practice by ID from Sanity:', error);
    return null;
  }
}
