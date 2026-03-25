import { supabase } from '@/lib/supabase';
import { DailyTip } from '@/types/dailyTip';

const HARDCODED_WELCOME_TIP: DailyTip = {
  id: 'welcome-tip',
  persona: 'other',
  stage: '0',
  date: new Date().toISOString().split('T')[0],
  category: 'general',
  title: 'Welcome to Canada!',
  description: 'Start your journey with Unify',
  tipText:
    'Check back daily for personalized tips based on where you are in your newcomer journey. Complete your profile to get tips tailored to you!',
  sourceRefs: null,
};

export const getDailyTip = async (
  persona: string,
  stage: string
): Promise<DailyTip> => {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('daily_tips')
    .select('*')
    .eq('persona', persona)
    .eq('stage', stage)
    .gte('date', yesterday)
    .order('date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error fetching daily tip:', error);
    return HARDCODED_WELCOME_TIP;
  }

  if (!data) {
    return HARDCODED_WELCOME_TIP;
  }

  return {
    id: data.id,
    persona: data.persona,
    stage: data.stage,
    date: data.date,
    category: data.category,
    title: data.title,
    description: data.description,
    tipText: data.tip_text,
    sourceRefs: data.source_refs,
  };
};
