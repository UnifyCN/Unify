import { sanityClient } from '../../sanity-custom';
import { SanityTask } from '../../types/sanity';
import {
  BASE_LANGUAGE_FILTER,
  i18nOverlay,
  mergeI18nOverlay,
  type SanityLanguage,
  type WithI18n,
} from './i18n';

// Match tasks that reference this submodule (references() catches any ref to submodule doc)
const TASKS_BY_SUBMODULE_QUERY = `*[_type == "task" && references($submoduleId) && ${BASE_LANGUAGE_FILTER}] | order(ordering asc) {
  _id,
  _type,
  _createdAt,
  _updatedAt,
  _rev,
  title,
  ordering,
  "submodule": submodule,
  content,
  ${i18nOverlay('title, content')}
}`;

const TASK_BY_ID_QUERY = `*[_type == "task" && _id == $taskId && ${BASE_LANGUAGE_FILTER}][0] {
  _id,
  _type,
  _createdAt,
  _updatedAt,
  _rev,
  title,
  ordering,
  "submodule": submodule,
  content,
  ${i18nOverlay('title, content')}
}`;

export async function getTasksBySubmodule(
  submoduleId: string,
  language: SanityLanguage = 'en'
): Promise<SanityTask[]> {
  try {
    const result = await sanityClient.fetch<WithI18n<SanityTask>[]>(
      TASKS_BY_SUBMODULE_QUERY,
      {
        submoduleId,
        lang: language,
      }
    );
    return Array.isArray(result) ? result.map(mergeI18nOverlay) : [];
  } catch (error) {
    console.error('Error fetching tasks by submodule from Sanity:', error);
    return [];
  }
}

export async function getTaskById(
  taskId: string,
  language: SanityLanguage = 'en'
): Promise<SanityTask | null> {
  try {
    const result = await sanityClient.fetch<WithI18n<SanityTask> | null>(
      TASK_BY_ID_QUERY,
      {
        taskId,
        lang: language,
      }
    );
    return result && !Array.isArray(result) ? mergeI18nOverlay(result) : null;
  } catch (error) {
    console.error('Error fetching task by id from Sanity:', error);
    return null;
  }
}
