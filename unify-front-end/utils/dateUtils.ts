import i18n from '@/i18n';

const formatSocialMediaTime = (timestamp: string | Date): string => {
  const now = new Date();
  const postDate = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - postDate.getTime()) / 1000);

  // Less than 1 minute
  if (diffInSeconds < 60) {
    return i18n.t('common.justNow');
  }

  // Less than 1 hour
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return i18n.t('common.minutesShort', { count: minutes });
  }

  // Less than 24 hours
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return i18n.t('common.hoursShort', { count: hours });
  }

  // Less than 7 days
  const diffInDays = Math.floor(diffInSeconds / 86400);
  if (diffInDays < 7) {
    return i18n.t('common.daysAgo', { count: diffInDays });
  }

  // Less than 6 weeks (42 days)
  if (diffInDays < 42) {
    const weeks = Math.floor(diffInDays / 7);
    if (weeks === 1) {
      return i18n.t('common.weekAgo');
    }
    return i18n.t('common.weeksAgo', { count: weeks });
  }

  // After 6 weeks, display pure date in yy-mm-dd format
  const year = postDate.getFullYear().toString().slice(-2);
  const month = (postDate.getMonth() + 1).toString().padStart(2, '0');
  const day = postDate.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Alternative: Format as absolute date (e.g., "Dec 15, 2023")
const formatAbsoluteDate = (timestamp: string | Date): string => {
  const postDate = new Date(timestamp);
  const now = new Date();

  // If it's this year, show month and day
  if (postDate.getFullYear() === now.getFullYear()) {
    return postDate.toLocaleDateString(i18n.language, {
      month: 'short',
      day: 'numeric',
    });
  }

  // If it's a different year, show month, day, and year
  return postDate.toLocaleDateString(i18n.language, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

// Smart formatter that chooses between relative and absolute
export const formatSmartTime = (timestamp: string | Date): string => {
  const now = new Date();
  const postDate = new Date(timestamp);
  const diffInDays = Math.floor(
    (now.getTime() - postDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Use relative time for posts less than 365 days old
  if (diffInDays < 365) {
    return formatSocialMediaTime(timestamp);
  }

  // Use absolute date for older posts
  return formatAbsoluteDate(timestamp);
};
