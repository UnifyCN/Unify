import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight as useJsBottomTabBarHeight } from '@react-navigation/bottom-tabs';

// On iOS we render NativeTabs (UITabBar), so @react-navigation/bottom-tabs'
// useBottomTabBarHeight throws — there is no JS tab navigator to measure.
// Approximate the native bar height: 49pt UITabBar + bottom safe-area inset
// (home indicator region).
const useIOSTabBarHeight = (): number => {
  const insets = useSafeAreaInsets();
  return 49 + insets.bottom;
};

// Platform.OS is determined at module load and never changes within a session,
// so the exported hook reference is stable — no rules-of-hooks violation.
export const useTabBarHeight =
  Platform.OS === 'ios' ? useIOSTabBarHeight : useJsBottomTabBarHeight;
