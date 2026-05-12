import { AppEventsLogger } from 'react-native-fbsdk-next';
import * as SecureStore from 'expo-secure-store';

const FIRED_PREFIX = 'meta_event_fired:';

async function logOnce(key: string, fire: () => void): Promise<void> {
  const storeKey = `${FIRED_PREFIX}${key}`;
  try {
    const already = await SecureStore.getItemAsync(storeKey);
    if (already) return;
    fire();
    await SecureStore.setItemAsync(storeKey, '1');
  } catch (err) {
    console.warn('[metaEvents] dedupe lookup failed; skipping event', err);
  }
}

export const logActivation = (userId: string) =>
  logOnce(`activation:${userId}`, () =>
    AppEventsLogger.logEvent(AppEventsLogger.AppEvents.CompletedRegistration),
  );

export const logAccountCreated = (userId: string) =>
  logOnce(`account_created:${userId}`, () =>
    AppEventsLogger.logEvent('unify_account_created'),
  );

export const logCompanionFirstMessage = (userId: string) =>
  logOnce(`companion:${userId}`, () =>
    AppEventsLogger.logEvent('unify_companion_first_message'),
  );

export const logGroupJoined = (userId: string) =>
  logOnce(`group_joined:${userId}`, () =>
    AppEventsLogger.logEvent('unify_group_joined'),
  );

export const logFirstPostCreated = (userId: string) =>
  logOnce(`first_post:${userId}`, () =>
    AppEventsLogger.logEvent('unify_first_post_created'),
  );

export const logPushPermissionGranted = (deviceId: string) =>
  logOnce(`push_granted:${deviceId}`, () =>
    AppEventsLogger.logEvent('unify_push_permission_granted'),
  );
