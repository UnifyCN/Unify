export type Priority =
  | 'Do now'
  | 'Do soon'
  | 'Explore and connect'
  | 'Explore & connect'
  | 'Optional / later';

export type StageNumber = 0 | 1 | 2 | 3 | 4;
export type Stage = '0' | '1' | '2' | '3' | '4';
export type LinkTab = 'home' | 'ai_companion' | 'community' | 'learn';
export type CommunityTarget = 'gather' | 'event' | 'circle';

/** Sanity checklist item (content from Sanity). Personas array: user sees item if user.persona in personas. */
export interface SanityChecklistItem {
  _id: string;
  _type: 'checklist';
  title: string;
  description?: string | null;
  class: 'do_now' | 'do_soon' | 'explore_and_connect' | 'optional_later';
  class_order: number;
  personas: string[];
  stage: string;
  module?: { _id: string; title: string } | null;
  submodule?: { _id: string; title: string; moduleId?: string } | null;

  linkTab?: LinkTab | null;

  //Only relevant when linkTab === 'community'
  communityTarget?: CommunityTarget | null;

  linkPath?: string | null; //Specifically will be used only for specific circles or stuff like that
  linkEventId?: number | null; 

}

const SANITY_CLASS_TO_PRIORITY: Record<
  SanityChecklistItem['class'],
  Priority
> = {
  do_now: 'Do now',
  do_soon: 'Do soon',
  explore_and_connect: 'Explore and connect',
  optional_later: 'Optional / later',
};

export function sanityChecklistItemToTaskDetails(
  item: SanityChecklistItem
): ChecklistTaskDetails {
  const moduleOrSub = item.module ?? item.submodule;
  return {
    task_name: item.title,
    task_description: item.description ?? '',
    priority: SANITY_CLASS_TO_PRIORITY[item.class],
    task_module: moduleOrSub?.title,
    linkModuleId: item.module?._id ?? item.submodule?.moduleId,
    linkSubmoduleId: item.submodule?._id,
    linkModuleTitle: moduleOrSub?.title,

    linkTab: item.linkTab ?? undefined,
    communityTarget: item.communityTarget ?? undefined,
    
    linkPath: item.linkPath ?? undefined,
    linkEventId: item.linkEventId ?? undefined,
  };
}

/** Display shape for checklist task (from Sanity or legacy Supabase) */
export interface ChecklistTaskDetails {
  task_name: string;
  task_description: string;
  priority: Priority;
  task_module?: string;
  /** For "Learn how" deep link: module id or submodule id */
  linkModuleId?: string;
  linkSubmoduleId?: string;
  linkModuleTitle?: string;

  linkTab?: LinkTab;
  communityTarget?: CommunityTarget;

  linkPath?: string;
  linkEventId?: number;
}

/** Legacy Supabase personalized task (kept for backward compat) */
export interface PersonalizedChecklistTask {
  id: number;
  persona: string;
  stage: Stage;
  priority: Priority;
  task_name: string;
  task_description: string;
  task_module: string;
}

export interface UserTask {
  user_task_id: number;
  user_id: string;
  task_id: number | null;
  sanity_checklist_id: string | null;
  completed: boolean;
  completed_at: string | null;
  task?: ChecklistTaskDetails;
}

export interface UserTaskWithDetails extends UserTask {
  task: ChecklistTaskDetails;
}
