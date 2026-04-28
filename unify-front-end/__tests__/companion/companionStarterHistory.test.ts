import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getSeenStarterIds,
  markStarterSeen,
  clearSeenStarterIds,
  COMPANION_STARTER_HISTORY_KEY,
} from '@/utils/companionStarterHistory';

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('companionStarterHistory', () => {
  it('returns an empty set when nothing is stored', async () => {
    const ids = await getSeenStarterIds();
    expect(ids.size).toBe(0);
  });

  it('persists a marked starter id', async () => {
    await markStarterSeen('persona_city');
    const ids = await getSeenStarterIds();
    expect(ids.has('persona_city')).toBe(true);
  });

  it('deduplicates repeated marks of the same id', async () => {
    await markStarterSeen('persona_city');
    await markStarterSeen('persona_city');
    const ids = await getSeenStarterIds();
    expect(ids.size).toBe(1);
  });

  it('preserves multiple distinct ids across marks', async () => {
    await markStarterSeen('a');
    await markStarterSeen('b');
    await markStarterSeen('c');
    const ids = await getSeenStarterIds();
    expect(Array.from(ids).sort()).toEqual(['a', 'b', 'c']);
  });

  it('clears all stored ids', async () => {
    await markStarterSeen('a');
    await markStarterSeen('b');
    await clearSeenStarterIds();
    const ids = await getSeenStarterIds();
    expect(ids.size).toBe(0);
  });

  it('returns an empty set when AsyncStorage contains malformed JSON', async () => {
    await AsyncStorage.setItem(COMPANION_STARTER_HISTORY_KEY, 'not-json');
    const ids = await getSeenStarterIds();
    expect(ids.size).toBe(0);
  });

  it('serializes concurrent marks so no updates are lost', async () => {
    await Promise.all([
      markStarterSeen('a'),
      markStarterSeen('b'),
      markStarterSeen('c'),
      markStarterSeen('d'),
      markStarterSeen('e'),
    ]);
    const ids = await getSeenStarterIds();
    expect(Array.from(ids).sort()).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it('orders a clear after preceding concurrent marks', async () => {
    await Promise.all([
      markStarterSeen('a'),
      markStarterSeen('b'),
      clearSeenStarterIds(),
    ]);
    const ids = await getSeenStarterIds();
    expect(ids.size).toBe(0);
  });
});
