import { supabase } from '@/lib/supabase';
import { DailyTip } from '@/types/dailyTip';

export const getDailyTip = async (): Promise<DailyTip | null> => {
  const { data, error } = await supabase.functions.invoke('get-daily-tip');

  if (error) {
    throw new Error(`Failed to fetch daily tip: ${error.message}`);
  }

  const tip = data?.tip;
  if (!tip) {
    // No tip available (e.g. generation failed server-side) — not retryable
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
