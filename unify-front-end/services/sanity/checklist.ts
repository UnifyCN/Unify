import { sanityClient } from '../../sanity-custom';
import { SanityChecklistItem } from '@/types/checklist';

/**
 * GROQ: checklist items where user's persona is in item's personas array
 * and user's stage matches item's stage. Order by class then class_order.
 * Params: $persona (slug from Supabase), $stage (slug from Supabase).
 */
const CHECKLIST_QUERY = `*[
  _type == "checklist"
  && $persona in personas
  && stage == $stage
] | order(class asc, class_order asc) {
  _id,
  _type,
  title,
  description,
  class,
  class_order,
  "module": module-> { _id, title },
  "submodule": submodule-> { _id, title, "moduleId": module._ref }
}`;

const CACHE_KEY = (persona: string, stageSlug: string) =>
  `checklist:${persona}:${stageSlug}`;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

let cache: {
  key: string;
  data: SanityChecklistItem[];
  ts: number;
} | null = null;

export async function getChecklistByPersonaAndStage(
  persona: string,
  stageSlug: string,
  options?: { skipCache?: boolean }
): Promise<SanityChecklistItem[]> {
  const key = CACHE_KEY(persona, stageSlug);
  const now = Date.now();

  if (
    !options?.skipCache &&
    cache?.key === key &&
    now - cache.ts < CACHE_TTL_MS
  ) {
    return cache.data;
  }

  try {
    const result = await sanityClient.fetch(CHECKLIST_QUERY, {
      persona,
      stage: stageSlug,
    });
    const data = Array.isArray(result) ? result : [];
    cache = { key, data, ts: now };
    return data;
  } catch (error) {
    console.error('Error fetching checklist from Sanity:', error);
    if (cache?.key === key) return cache.data;
    return [];
  }
}

export function clearChecklistCache(): void {
  cache = null;
}
