import { supabase } from '../../lib/supabase';
import { SubmoduleIntro } from '../../types/learn';

export const getSubmoduleIntro = async (
  submoduleId: string,
  pageNum: number = 1
): Promise<SubmoduleIntro> => {
  if (!submoduleId) throw new Error('Missing submoduleId');

  const { data: intro, error } = await supabase
    .from('submodule_intro')
    .select('id, submodule_id, order_num, content_type, content')
    .eq('submodule_id', submoduleId)
    .eq('order_num', pageNum)
    .single();

  if (error) throw new Error(`Failed to fetch submodule intro: ${error.message}`);

  return {
    id: intro.id,
    submodule_id: intro.submodule_id,
    order_num: intro.order_num,
    content_type: intro.content_type,
    content: intro.content,
  };
};

export const getSubmoduleIntroPages = async (
  submoduleId: string
): Promise<number> => {
  if (!submoduleId) throw new Error('Missing submoduleId');

  const { count, error } = await supabase
    .from('submodule_intro')
    .select('*', { count: 'exact', head: true })
    .eq('submodule_id', submoduleId);

  if (error) throw new Error(`Failed to fetch intro pages count: ${error.message}`);

  return count || 0;
};
