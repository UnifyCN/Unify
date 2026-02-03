export const Layout = {
  header: {
    horizontalPadding: 20,
    topInsetOffset: 8,
    rowHeight: 48,
    iconSize: 24,
  },
} as const;

export const getHeaderHeight = (topInset: number) =>
  topInset + Layout.header.topInsetOffset + Layout.header.rowHeight;
