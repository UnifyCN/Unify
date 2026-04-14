import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { getAllModulesWithSubmodules } from '@/services/sanity/modules';
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
  const timeout = setTimeout(() => controller.abort(), 3000);

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

// ─── Merge helper ─────────────────────────────────────────────────────────────

/**
 * Merge personalized ranking with full Sanity module data.
 * Preserves the edge function's order (do NOT re-sort).
 * Sanity modules with no learn_modules row are appended at the end with score 0.
 */
function mergePersonalizedWithSanity(
  personalized: PersonalizedModule[],
  sanityModules: SanityModuleWithSubmodules[]
): PersonalizedSanityModule[] {
  const sanityById = new Map(sanityModules.map(m => [m._id, m]));
  const result: PersonalizedSanityModule[] = [];

  for (const pm of personalized) {
    const sanity = sanityById.get(pm.sanity_id);
    if (sanity) {
      result.push({
        ...sanity,
        progress: pm.progress,
        score: pm.score,
        why_tag: pm.why_tag,
      });
      sanityById.delete(pm.sanity_id);
    }
  }

  // Append unscored Sanity modules at the end
  for (const remaining of sanityById.values()) {
    result.push({ ...remaining, progress: 'not_started', score: 0, why_tag: '' });
  }

  return result;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export type PersonalizedSanityModule = SanityModuleWithSubmodules & {
  progress: PersonalizedModule['progress'];
  score: number;
  why_tag: string;
};

interface UsePersonalizedModulesResult {
  modules: PersonalizedSanityModule[] | undefined;
  isLoading: boolean;
  isPersonalized: boolean;
  error: Error | null;
  refetch: () => void;
}

export function usePersonalizedModules(): UsePersonalizedModulesResult {
  // Always fetch Sanity modules (they own colorTheme, icon, submodules)
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

  // Always fetch personalized ranking
  const {
    data: personalizedData,
    isLoading: personalizeLoading,
    refetch: refetchPersonalized,
  } = useQuery({
    queryKey: ['personalize', 'learn'],
    queryFn: fetchPersonalizedLearn,
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    placeholderData: keepPreviousData,
    retry: 1,
  });

  const isLoading = sanityLoading || personalizeLoading;

  const isPersonalized =
    !!personalizedData?.modules?.length && !!sanityModules?.length;

  let modules: PersonalizedSanityModule[] | undefined;

  if (sanityModules) {
    if (isPersonalized && personalizedData) {
      modules = mergePersonalizedWithSanity(
        personalizedData.modules,
        sanityModules
      );
    } else {
      // Fallback: Sanity order, unscored
      modules = sanityModules.map(m => ({
        ...m,
        progress: 'not_started' as const,
        score: 0,
        why_tag: '',
      }));
    }
  }

  const refetch = () => {
    refetchSanity();
    refetchPersonalized();
  };

  return {
    modules,
    isLoading,
    isPersonalized,
    error: sanityError as Error | null,
    refetch,
  };
}
