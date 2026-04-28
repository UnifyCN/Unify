import AsyncStorage from '@react-native-async-storage/async-storage';

export const COMPANION_STARTER_HISTORY_KEY = '@companion_seen_starter_ids_v1';

// Serialize all read-modify-write operations on the seen-starter set.
// Concurrent fire-and-forget markStarterSeen() calls (e.g. when the user taps
// two chips in rapid succession) would otherwise read the same pre-write state
// and the last writer wins, dropping the earlier id. The queue makes each
// mutation see the committed result of the previous one.
let writeQueue: Promise<unknown> = Promise.resolve();

function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  // Always run after the previous tail, regardless of whether it failed.
  const result = writeQueue.then(fn, fn);
  // Keep the chain tail resolvable so a failure doesn't poison subsequent work.
  writeQueue = result.then(
    () => undefined,
    () => undefined
  );
  return result;
}

// Bypasses the queue; safe to use only from within an enqueued operation,
// or from external readers that have already awaited writeQueue.
async function readRaw(): Promise<Set<string>> {
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

export async function getSeenStarterIds(): Promise<Set<string>> {
  // Wait for any pending mutation to settle so callers see the post-write state.
  await writeQueue.catch(() => undefined);
  return readRaw();
}

export function markStarterSeen(id: string): Promise<void> {
  return enqueue(async () => {
    try {
      const current = await readRaw();
      if (current.has(id)) return;
      current.add(id);
      await AsyncStorage.setItem(
        COMPANION_STARTER_HISTORY_KEY,
        JSON.stringify(Array.from(current))
      );
    } catch {
      // Best effort — failing means the chip might re-appear next session.
    }
  });
}

export function clearSeenStarterIds(): Promise<void> {
  return enqueue(async () => {
    try {
      await AsyncStorage.removeItem(COMPANION_STARTER_HISTORY_KEY);
    } catch {
      // No-op.
    }
  });
}
