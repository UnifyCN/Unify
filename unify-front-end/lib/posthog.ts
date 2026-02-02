import type {
  PostHogAutocaptureOptions,
  PostHogOptions,
} from 'posthog-react-native';

export const posthogApiKey = process.env.EXPO_PUBLIC_POSTHOG_API_KEY ?? '';
export const posthogHost =
  process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';

export const posthogOptions: PostHogOptions = {
  host: posthogHost,
  enableSessionReplay: true,
  sessionReplayConfig: {
    maskAllTextInputs: true,
    maskAllImages: true,
    maskAllSandboxedViews: true,
    captureLog: true,
    captureNetworkTelemetry: true,
    throttleDelayMs: 1000,
  },
};

export const posthogAutocapture: PostHogAutocaptureOptions = {
  captureScreens: false,
  captureTouches: true,
};
