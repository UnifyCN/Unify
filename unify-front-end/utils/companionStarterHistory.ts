import AsyncStorage from '@react-native-async-storage/async-storage';

export const COMPANION_STARTER_HISTORY_KEY = '@companion_seen_starter_ids_v1';

export async function getSeenStarterIds(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(COMPANION_STARTER_HISTORY_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((x): x is string => typeof x === 'string'));
  } catch {
    return new Set();
  }
}

export async function markStarterSeen(id: string): Promise<void> {
  try {
    const current = await getSeenStarterIds();
    if (current.has(id)) return;
    current.add(id);
    await AsyncStorage.setItem(
      COMPANION_STARTER_HISTORY_KEY,
      JSON.stringify(Array.from(current))
    );
  } catch {
    // Best effort — failing means the chip might re-appear next session.
  }
}

export async function clearSeenStarterIds(): Promise<void> {
  try {
    await AsyncStorage.removeItem(COMPANION_STARTER_HISTORY_KEY);
  } catch {
    // No-op.
  }
}
