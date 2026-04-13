import { supabase } from '@/lib/supabase';
import { Group } from '@/types/groups';
import { getAvailableGroups } from './getAvailableGroups';

type PersonalizeItem = {
  id: string | number;
  name?: string;
  group_name?: string;
  score?: number;
  why_tag?: string | null;
  social_proof?: { count: number; label: string } | null;
  group_description?: string | null;
  member_count?: number;
  cover_photo_url?: string | null;
  created_at?: string | null;
};

type PersonalizedGroups = { groups?: { items?: PersonalizeItem[] } };

export const getPersonalizedGroups = async (): Promise<Group[]> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;

  if (!token) throw new Error('User not authenticated');

  let json: PersonalizedGroups | null = null;

  try {
    if (
      (supabase as any).functions &&
      typeof (supabase as any).functions.invoke === 'function'
    ) {
      const invokeResult = await (supabase as any).functions.invoke(
        'personalize?surfaces=groups',
        { method: 'GET', headers: { Authorization: `Bearer ${token}` } }
      );

      // If invoke returned companion-only (or no groups), force the fetch/DB fallback.
      if (invokeResult?.data && !invokeResult?.error) {
        if (
          invokeResult.data.groups &&
          Array.isArray(invokeResult.data.groups.items)
        ) {
          json = invokeResult.data as PersonalizedGroups;
        }
      }
    }
  } catch (err) {
    console.warn('personalize: invoke threw', err);
  }

  // Fallback to directly fetching the function endpoint
  if (!json) {
    const baseUrl =
      (supabase as any).url ||
      (process.env.EXPO_PUBLIC_SUPABASE_URL as string) ||
      (process.env.SUPABASE_URL as string) ||
      '';
    const fnUrl = baseUrl
      ? `${baseUrl.replace(/\/$/, '')}/functions/v1/personalize?surfaces=groups`
      : '/functions/v1/personalize?surfaces=groups';

    try {
      const resp = await fetch(fnUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const text = await resp.text().catch(() => '');
      console.log('personalize: fetch status', resp.status, text);

      if (!resp.ok) {
        console.warn('personalize: fetch failed', resp.status, text);
      } else {
        try {
          json = JSON.parse(text) as PersonalizedGroups;
          console.log(
            'personalize: fetch -> items',
            json?.groups?.items?.length ?? 0
          );
        } catch (parseErr) {
          console.warn('personalize: fetch parse error', parseErr, text);
        }
      }
    } catch (err) {
      console.warn('personalize: fetch threw', err);
    }
  }

  // If personalize returned nothing, fall back to direct DB query
  const items = json?.groups?.items ?? [];
  if (!items || items.length === 0) {
    console.warn(
      'personalize returned no items — falling back to getAvailableGroups'
    );
    return getAvailableGroups();
  }

  return items.map((it: any) => ({
    id: Number(it.id),
    name: (it.group_name ?? it.name ?? '').toString(),
    description: it.group_description ?? null,
    memberCount: it.member_count ?? 0,
    coverPhotoUrl: it.cover_photo_url ?? null,
    createdAt: it.created_at ?? '',
    score: it.score != null ? Number(it.score) : undefined,
    why_tag: it.why_tag ?? null,
    social_proof: it.social_proof ?? null,
  }));
};
