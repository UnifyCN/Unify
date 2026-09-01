/**
 * Shared semantic colors for the Resources directory.
 *
 * Keep text colors here so every foreground/background pair can be covered by
 * the contrast regression suite instead of drifting inside component styles.
 */
export const RESOURCE_THEME = {
  surface: '#FFFFFF',
  surfaceSubtle: '#F8F9FA',
  surfaceSegment: '#F2F2F2',
  surfaceChip: '#F3F4F6',
  surfaceNotice: '#F2F4F7',
  textHeading: '#161616',
  textStrong: '#1F2937',
  textBody: '#3A3A3A',
  textDetail: '#374151',
  textSecondary: '#575757',
  textMuted: '#626269',
  textLabel: '#5F6672',
  textNotice: '#46505E',
  iconNotice: '#465570',
} as const;
