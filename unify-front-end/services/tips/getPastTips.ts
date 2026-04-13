import { supabase } from '@/lib/supabase';
import { DailyTip } from '@/types/dailyTip';

export const getPastTips = async (): Promise<DailyTip[]> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  // Fetch this user's own past tips (per-user storage)
  const { data, error } = await supabase
    .from('daily_tips')
    .select('*')
    .eq('user_id', user.id)
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
