import { Settings } from 'react-native-fbsdk-next';
import * as TrackingTransparency from 'expo-tracking-transparency';

export interface InitMetaSDKOptions {
  /**
   * `true` during onboarding: show the iOS App Tracking Transparency system
   * prompt if the user hasn't decided yet. `false` on every app launch: never
   * prompt, just read the current decision.
   */
  requestATT: boolean;
}

/**
 * Initialize the Meta (Facebook) SDK and align advertiser tracking with the
 * user's iOS App Tracking Transparency (ATT) decision.
 *
 * The OS is the single source of truth for tracking consent — there is no
 * in-app toggle. iOS shows the system prompt once; afterwards the user changes
 * their choice in iPhone Settings → Privacy & Security → Tracking. We read the
 * live OS status on every launch so those Settings changes are always honored.
 *
 * `requestTrackingPermissionsAsync` only shows the dialog when the status is
 * undetermined; otherwise it returns the existing decision without prompting.
 * `getTrackingPermissionsAsync` never prompts. On Android and web, both always
 * resolve as `granted` (ATT is iOS-only), and `setAdvertiserTrackingEnabled` is
 * an iOS-specific no-op there.
 */
export async function initMetaSDK({
  requestATT,
}: InitMetaSDKOptions): Promise<void> {
  const { status } = requestATT
    ? await TrackingTransparency.requestTrackingPermissionsAsync()
    : await TrackingTransparency.getTrackingPermissionsAsync();

  Settings.initializeSDK();
  Settings.setAdvertiserTrackingEnabled(status === 'granted');
}
