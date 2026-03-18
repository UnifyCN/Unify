import { Platform } from 'react-native';

const IOS_TAB_HEADER = {
  horizontalPadding: 20,
  rowHeight: 44,
  actionSize: 44,
  iconSize: 26,
  logoSize: 32,
  iconStrokeWidth: 2.25,
  actionGap: 0,
  actionOverlap: 0,
  badgeTop: 5,
  badgeRight: 3,
} as const;

const ANDROID_TAB_HEADER = {
  horizontalPadding: 20,
  rowHeight: 56,
  actionSize: 48,
  iconSize: 24,
  logoSize: 28,
  iconStrokeWidth: 2.25,
  actionGap: 0,
  actionOverlap: -4,
  badgeTop: 7,
  badgeRight: 5,
} as const;

export const TAB_HEADER_METRICS =
  Platform.OS === 'ios' ? IOS_TAB_HEADER : ANDROID_TAB_HEADER;

export const getTabHeaderHeight = (topInset: number) =>
  topInset + TAB_HEADER_METRICS.rowHeight;
