import { Dimensions, Platform } from 'react-native';

const screenWidth = Dimensions.get('window').width;

export const isTablet = screenWidth >= 768;

/**
 * Platform-aware header constants.
 * iOS compact headers: topInset + 44pt (Apple HIG).
 * Android compact headers: topInset + 56dp (Material 3 top app bar).
 */
export const Layout = {
  header: {
    horizontalPadding: 20,
    topInsetOffset: 8,
    rowHeight: Platform.select({ ios: 36, default: 48 }),
    iconSize: 24,
  },
  content: {
    maxWidth: 600,
    horizontalPadding: isTablet ? 40 : 20,
  },
} as const;

/** Returns total header height: topInset + topInsetOffset + rowHeight.
 *  iOS: topInset + 44, Android: topInset + 56. */
export const getHeaderHeight = (topInset: number) =>
  topInset + Layout.header.topInsetOffset + Layout.header.rowHeight;
