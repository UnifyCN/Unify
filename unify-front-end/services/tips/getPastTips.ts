import { supabase } from '@/lib/supabase';
import { DailyTip } from '@/types/dailyTip';

export const getPastTips = async (): Promise<DailyTip[]> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  // Get user's persona to fetch their cohort's past tips
  const { data: profile } = await supabase
    .from('user_onboarding_profiles')
    .select('persona, stage')
    .eq('id', user.id)
    .maybeSingle();

  const persona = profile?.persona || 'other';

  // Fetch tips for this persona across all stages so history persists
  // even if the user's stage advances
  const { data, error } = await supabase
    .from('daily_tips')
    .select('*')
    .eq('persona', persona)
    .order('date', { ascending: false })
    .limit(30);

  if (error) {
    console.error('Error fetching past tips:', error);
    return [];
  }

  return (
    data?.map(tip => ({
      id: tip.id,
      persona: tip.persona,
      stage: tip.stage,
      date: tip.date,
      category: tip.category,
      title: tip.title,
      description: tip.description,
      tipText: tip.tip_text,
      sourceRefs: tip.source_refs,
    })) || []
  );
};
