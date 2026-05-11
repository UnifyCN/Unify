import { Settings } from 'react-native-fbsdk-next';
import * as TrackingTransparency from 'expo-tracking-transparency';
import * as SecureStore from 'expo-secure-store';

export interface InitMetaSDKOptions {
  requestATT: boolean;
}

type ATTStatus = 'granted' | 'denied' | 'restricted' | 'undetermined' | 'skipped';

const STORAGE_KEY = 'meta_att_status';

export async function initMetaSDK({ requestATT }: InitMetaSDKOptions): Promise<void> {
  let attStatus: ATTStatus | null = null;

  // Check if ATT decision is already persisted
  const persistedStatus = await SecureStore.getItemAsync(STORAGE_KEY);

  if (persistedStatus) {
    // Use persisted status, skip requesting ATT
    attStatus = persistedStatus as ATTStatus;
  } else if (requestATT) {
    // Request ATT permission
    const result = await TrackingTransparency.requestTrackingPermissionsAsync();
    attStatus = result.status as ATTStatus;
  } else {
    // User opted out of ATT request
    attStatus = 'skipped';
  }

  // Initialize Meta SDK
  Settings.initializeSDK();

  // Enable advertiser tracking only if ATT was granted
  const trackingEnabled = attStatus === 'granted';
  Settings.setAdvertiserTrackingEnabled(trackingEnabled);

  // Persist the ATT decision for future sessions
  await SecureStore.setItemAsync(STORAGE_KEY, attStatus);
}
