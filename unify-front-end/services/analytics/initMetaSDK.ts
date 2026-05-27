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
  // Initialize synchronously FIRST so the SDK is ready to log events before the
  // awaited ATT read resolves. Otherwise an event fired in that window (the
  // native permission read is a round-trip) could hit an uninitialized SDK and
  // be dropped.
  Settings.initializeSDK();

  const { status } = requestATT
    ? await TrackingTransparency.requestTrackingPermissionsAsync()
    : await TrackingTransparency.getTrackingPermissionsAsync();

  Settings.setAdvertiserTrackingEnabled(status === 'granted');
}

/**
 * Prompt returning users for tracking permission — once.
 *
 * Users who finished onboarding before ATT was added were never asked, so their
 * status sits at `undetermined` forever. This shows them the system dialog on a
 * launch. iOS only presents it while the status is undetermined; once they
 * answer, every future call is a no-op. New users are handled by the onboarding
 * flow instead, so callers should only invoke this once onboarding is complete.
 */
export async function promptATTForReturningUsers(): Promise<void> {
  const { status } = await TrackingTransparency.getTrackingPermissionsAsync();
  if (status !== 'undetermined') return;
  await initMetaSDK({ requestATT: true });
}

/**
 * Pure gate for the returning-user ATT prompt, extracted so the (otherwise
 * render-heavy) RootLayout wiring can be unit-tested. Prompt only when: on iOS,
 * the splash is gone, the onboarding flag has been read, the user was already
 * onboarded at launch, and we haven't prompted yet this session.
 */
export function shouldPromptReturningUserATT(params: {
  isIOS: boolean;
  splashDone: boolean;
  onboardingChecked: boolean;
  wasOnboardedAtLaunch: boolean;
  alreadyPrompted: boolean;
}): boolean {
  return (
    params.isIOS &&
    params.splashDone &&
    params.onboardingChecked &&
    params.wasOnboardedAtLaunch &&
    !params.alreadyPrompted
  );
}
