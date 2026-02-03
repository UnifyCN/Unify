import { sanityClient } from '../../sanity-custom';
import { SanityTask } from '../../types/sanity';

// Match tasks that reference this submodule (references() catches any ref to submodule doc)
const TASKS_BY_SUBMODULE_QUERY = `*[_type == "task" && references($submoduleId)] | order(ordering asc) {
  _id,
  _type,
  _createdAt,
  _updatedAt,
  _rev,
  title,
  ordering,
  "submodule": submodule,
  content
}`;

const TASK_BY_ID_QUERY = `*[_type == "task" && _id == $taskId][0] {
  _id,
  _type,
  _createdAt,
  _updatedAt,
  _rev,
  title,
  ordering,
  "submodule": submodule,
  content
}`;

export async function getTasksBySubmodule(
  submoduleId: string
): Promise<SanityTask[]> {
  try {
    const result = await sanityClient.fetch(TASKS_BY_SUBMODULE_QUERY, {
      submoduleId,
    });
    return Array.isArray(result) ? result : [];
  } catch (error) {
    console.error('Error fetching tasks by submodule from Sanity:', error);
    return [];
  }
}

export async function getTaskById(
  taskId: string
): Promise<SanityTask | null> {
  try {
    const result = await sanityClient.fetch(TASK_BY_ID_QUERY, {
      taskId,
    });
    return result && !Array.isArray(result) ? result : null;
  } catch (error) {
    console.error('Error fetching task by id from Sanity:', error);
    return null;
  }
}
