import { Dimensions } from 'react-native';

const screenWidth = Dimensions.get('window').width;

export const isTablet = screenWidth >= 768;

export const Layout = {
  header: {
    horizontalPadding: 20,
    topInsetOffset: 8,
    rowHeight: 48,
    iconSize: 24,
  },
  content: {
    maxWidth: 600,
    horizontalPadding: isTablet ? 40 : 20,
  },
} as const;

export const getHeaderHeight = (topInset: number) =>
  topInset + Layout.header.topInsetOffset + Layout.header.rowHeight;
