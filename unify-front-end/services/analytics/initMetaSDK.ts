import { Settings } from 'react-native-fbsdk-next';
import * as TrackingTransparency from 'expo-tracking-transparency';
import * as SecureStore from 'expo-secure-store';

export interface InitMetaSDKOptions {
  requestATT: boolean;
}

type TerminalStatus = 'granted' | 'denied';
type ATTStatus = TerminalStatus | 'restricted' | 'undetermined' | 'skipped';

const STORAGE_KEY = 'meta_att_status';

const isTerminal = (s: string | null): s is TerminalStatus =>
  s === 'granted' || s === 'denied';

export async function initMetaSDK({
  requestATT,
}: InitMetaSDKOptions): Promise<void> {
  let attStatus: ATTStatus;

  // Only terminal OS decisions ('granted' / 'denied') short-circuit the
  // request path. 'skipped' (user tapped "Not now") and edge states
  // ('undetermined' / 'restricted') leave the door open to re-request later.
  const persistedStatus = await SecureStore.getItemAsync(STORAGE_KEY);

  if (isTerminal(persistedStatus)) {
    attStatus = persistedStatus;
  } else if (requestATT) {
    const result = await TrackingTransparency.requestTrackingPermissionsAsync();
    attStatus = result.status as ATTStatus;
  } else {
    attStatus = 'skipped';
  }

  Settings.initializeSDK();
  Settings.setAdvertiserTrackingEnabled(attStatus === 'granted');

  // Persist only terminal decisions so non-terminal states can re-prompt.
  if (isTerminal(attStatus)) {
    await SecureStore.setItemAsync(STORAGE_KEY, attStatus);
  }
}
