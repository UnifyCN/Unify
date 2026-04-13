import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { getAllModulesWithSubmodules } from '@/services/sanity/modules';
import { FEATURE_FLAGS } from '@/constants/featureFlags';
import type {
  PersonalizeLearnResponse,
  PersonalizedModule,
} from '@/types/learn';
import type { SanityModuleWithSubmodules } from '@/types/sanity';

// ─── Personalize fetch ────────────────────────────────────────────────────────

async function fetchPersonalizedLearn(): Promise<PersonalizeLearnResponse | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) return null;

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(
      `${supabaseUrl}/functions/v1/personalize?surfaces=learn`,
      {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      }
    );

    if (!res.ok) return null;
    const json = await res.json();
    return (json?.learn as PersonalizeLearnResponse) ?? null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// ─── Merge helpers ────────────────────────────────────────────────────────────

/**
 * Merge the personalized ranking with full Sanity module data.
 * Returns modules in personalized order, enriched with colorTheme, icon, submodules.
 * Sanity modules that have no corresponding `learn_modules` row are appended at the end.
 */
function mergePersonalizedWithSanity(
  personalized: PersonalizedModule[],
  sanityModules: SanityModuleWithSubmodules[]
): Array<SanityModuleWithSubmodules & { progress: PersonalizedModule['progress']; score: number }> {
  const sanityById = new Map(sanityModules.map(m => [m._id, m]));
  const result: Array<SanityModuleWithSubmodules & { progress: PersonalizedModule['progress']; score: number }> = [];

  for (const pm of personalized) {
    const sanity = sanityById.get(pm.sanity_id);
    if (sanity) {
      result.push({ ...sanity, progress: pm.progress, score: pm.score });
      sanityById.delete(pm.sanity_id);
    }
  }

  // Append any Sanity modules not returned by the personalize endpoint (new or unscored)
  for (const remaining of sanityById.values()) {
    result.push({ ...remaining, progress: 'not_started', score: 0 });
  }

  // Guarantee score-descending order even if the API response drifts
  result.sort((a, b) => b.score - a.score);

  return result;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export type PersonalizedSanityModule = SanityModuleWithSubmodules & {
  progress: PersonalizedModule['progress'];
  score: number;
};

interface UsePersonalizedModulesResult {
  modules: PersonalizedSanityModule[] | undefined;
  isLoading: boolean;
  isPersonalized: boolean;
  error: Error | null;
  refetch: () => void;
}

export function usePersonalizedModules(): UsePersonalizedModulesResult {
  const flagOn = FEATURE_FLAGS.personalization_enabled;

  // Always fetch Sanity modules for content (they contain colorTheme, icon, submodules)
  const {
    data: sanityModules,
    isLoading: sanityLoading,
    error: sanityError,
    refetch: refetchSanity,
  } = useQuery({
    queryKey: ['sanity', 'modules'],
    queryFn: getAllModulesWithSubmodules,
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    placeholderData: keepPreviousData,
  });

  // Fetch personalized ranking — only when feature flag is on
  const {
    data: personalizedData,
    isLoading: personalizeLoading,
    refetch: refetchPersonalized,
  } = useQuery({
    queryKey: ['personalize', 'learn'],
    queryFn: fetchPersonalizedLearn,
    enabled: flagOn,
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    placeholderData: keepPreviousData,
    retry: 1,
  });

  const isLoading = sanityLoading || (flagOn && personalizeLoading);

  const isPersonalized =
    flagOn &&
    !!personalizedData?.modules?.length &&
    !!sanityModules?.length;

  let modules: PersonalizedSanityModule[] | undefined;

  if (sanityModules) {
    if (isPersonalized && personalizedData) {
      modules = mergePersonalizedWithSanity(
        personalizedData.modules,
        sanityModules
      );
    } else {
      // Fallback: Sanity order, all modules marked not_started
      modules = sanityModules.map(m => ({
        ...m,
        progress: 'not_started' as const,
        score: 0,
      }));
    }
  }

  const refetch = () => {
    refetchSanity();
    if (flagOn) refetchPersonalized();
  };

  return {
    modules,
    isLoading,
    isPersonalized,
    error: sanityError as Error | null,
    refetch,
  };
}
