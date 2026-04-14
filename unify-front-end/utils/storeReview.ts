import { Platform } from 'react-native';

/**
 * Request the native iOS App Store review prompt.
 * Dynamically imports expo-store-review to avoid crashing
 * when the native module isn't available (e.g. Expo Go).
 * Fire-and-forget — never blocks UI or throws.
 */
export async function requestStoreReview(): Promise<void> {
  if (Platform.OS !== 'ios') return;

  try {
    const StoreReview = await import('expo-store-review');

    const available = await StoreReview.isAvailableAsync();
    if (!available) return;

    await StoreReview.requestReview();
  } catch {
    // Non-critical — silently ignore if native module unavailable
  }
}
