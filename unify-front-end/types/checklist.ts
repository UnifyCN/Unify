export type Priority =
  | 'Do now'
  | 'Do soon'
  | 'Explore & connect'
  | 'Optional / later';

export type StageNumber = 0 | 1 | 2 | 3 | 4;
export type Stage = '0' | '1' | '2' | '3' | '4';

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
  task_id: number;
  completed: boolean;
  completed_at: string | null;
  task?: PersonalizedChecklistTask; // Joined task details
}

export interface UserTaskWithDetails extends UserTask {
  task: PersonalizedChecklistTask;
}
