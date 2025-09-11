import { supabase } from '../../lib/supabase';

export interface Module {
  id: string;
  title: string;
  description: string;
  total_submodules: number;
  completed_submodules: number;
  progress_percent: number;
  is_completed: boolean;
}

export async function getAllModules(): Promise<Module[]> {
  try {
    console.log('Fetching all modules...');
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Error getting user:', userError);
      return [];
    }

    // Get all modules
    const { data: modules, error: modulesError } = await supabase
      .from('modules')
      .select('id, title, description')
      .order('title');

    if (modulesError) {
      console.error('Error fetching modules:', modulesError);
      return [];
    }

    if (!modules || modules.length === 0) {
      console.log('No modules found');
      return [];
    }

    console.log('Found modules:', modules);

    // Get user progress for all modules
    const { data: userProgress, error: progressError } = await supabase
      .from('user_module_progress')
      .select('module_id, progress_percent, is_completed')
      .eq('user_id', user.id);

    if (progressError) {
      console.error('Error fetching user progress:', progressError);
    }

    // Get submodule counts for each module
    const { data: submoduleCounts, error: submoduleError } = await supabase
      .from('submodules')
      .select('module_id, id')
      .in('module_id', modules.map(m => m.id));

    if (submoduleError) {
      console.error('Error fetching submodule counts:', submoduleError);
    }

    // Get completed submodule counts
    const { data: completedSubmodules, error: completedError } = await supabase
      .from('user_submodule_progress')
      .select('submodule_id, is_completed')
      .eq('user_id', user.id)
      .eq('is_completed', true);

    if (completedError) {
      console.error('Error fetching completed submodules:', completedError);
    }

    // Process the data
    const modulesWithProgress = modules.map(module => {
      const progress = userProgress?.find(p => p.module_id === module.id);
      const totalSubmodules = submoduleCounts?.filter(s => s.module_id === module.id).length || 0;
      const completedSubmodulesCount = completedSubmodules?.filter(cs => 
        submoduleCounts?.find(s => s.id === cs.submodule_id && s.module_id === module.id)
      ).length || 0;

      return {
        id: module.id,
        title: module.title,
        description: module.description,
        total_submodules: totalSubmodules,
        completed_submodules: completedSubmodulesCount,
        progress_percent: progress?.progress_percent || 0,
        is_completed: progress?.is_completed || false,
      };
    });

    console.log('Processed modules with progress:', modulesWithProgress);
    return modulesWithProgress;

  } catch (error) {
    console.error('Error in getAllModules:', error);
    return [];
  }
}
