import { supabase } from '../../lib/supabase';

export interface StageInfo {
  id: string;
  title: string;
  description: string;
  order_num: number;
  submodule: { id: string; title: string };
}

export const getStageInfo = async (stageId: string): Promise<StageInfo> => {
  if (!stageId) throw new Error('Missing stageId');

  const { data: stage, error } = await supabase
    .from('stages')
    .select('id, title, description, order_num, submodule_id')
    .eq('id', stageId)
    .single();

  if (error) throw new Error(`Failed to fetch stage: ${error.message}`);

  const { data: sub, error: subErr } = await supabase
    .from('submodules')
    .select('id, title')
    .eq('id', stage.submodule_id)
    .single();

  if (subErr) throw new Error(`Failed to fetch submodule: ${subErr.message}`);

  return {
    id: stage.id,
    title: stage.title,
    description: stage.description || '',
    order_num: stage.order_num,
    submodule: { id: sub.id, title: sub.title },
  };
};
