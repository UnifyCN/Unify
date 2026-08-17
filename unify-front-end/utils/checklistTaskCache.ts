import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserTaskWithDetails } from '@/types/checklist';
import type { SanityLanguage } from '@/services/sanity/i18n';

const STORAGE_PREFIX = '@checklist_tasks_v1';

export function buildChecklistCacheStorageKey(
  userId: string,
  stage: number,
  personaSlug: string,
  stageChanged: boolean,
  language: SanityLanguage
): string {
  return `${STORAGE_PREFIX}:${userId}:${stage}:${personaSlug}:${
    stageChanged ? '1' : '0'
  }:${language}`;
}

const memory = new Map<string, UserTaskWithDetails[]>();

export function getChecklistMemoryCache(
  key: string
): UserTaskWithDetails[] | undefined {
  return memory.get(key);
}

export function setChecklistMemoryCache(
  key: string,
  tasks: UserTaskWithDetails[]
): void {
  memory.set(key, tasks);
}

export async function loadChecklistFromDisk(
  key: string
): Promise<UserTaskWithDetails[] | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as UserTaskWithDetails[];
  } catch {
    return null;
  }
}

export async function saveChecklistToDisk(
  key: string,
  tasks: UserTaskWithDetails[]
): Promise<void> {
  try {
    memory.set(key, tasks);
    await AsyncStorage.setItem(key, JSON.stringify(tasks));
  } catch (e) {
    console.warn('Failed to persist checklist cache', e);
  }
}
