import { supabase } from '@/lib/supabase';
import { DailyTip } from '@/types/dailyTip';

export const getDailyTip = async (): Promise<DailyTip | null> => {
  const { data, error } = await supabase.functions.invoke('get-daily-tip');

  if (error) {
    console.error('Error fetching daily tip:', error);
    return null;
  }

  const tip = data?.tip;
  if (!tip) {
    return null;
  }

  return {
    id: tip.id,
    persona: tip.persona,
    stage: tip.stage,
    date: tip.date,
    category: tip.category,
    title: tip.title,
    description: tip.description,
    tipText: tip.tip_text,
    sourceRefs: tip.source_refs,
  };
};
