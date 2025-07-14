export const formatSocialMediaTime = (timestamp: string | Date): string => {
  const now = new Date();
  const postDate = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - postDate.getTime()) / 1000);

  // Less than 1 minute
  if (diffInSeconds < 60) {
    return 'Just now';
  }

  // Less than 1 hour
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m ago`;
  }

  // Less than 24 hours
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  }

  // Less than 7 days
  const diffInDays = Math.floor(diffInSeconds / 86400);
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }

  // Less than 30 days
  if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return `${weeks}w ago`;
  }

  // Less than 365 days
  const months = Math.floor(diffInDays / 30);
  return `${months}mo ago`;
};

// Alternative: Format as absolute date (e.g., "Dec 15, 2023")
export const formatAbsoluteDate = (timestamp: string | Date): string => {
  const postDate = new Date(timestamp);
  const now = new Date();

  // If it's this year, show month and day
  if (postDate.getFullYear() === now.getFullYear()) {
    return postDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  }

  // If it's a different year, show month, day, and year
  return postDate.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
};

// Smart formatter that chooses between relative and absolute
export const formatSmartTime = (timestamp: string | Date): string => {
  const now = new Date();
  const postDate = new Date(timestamp);
  const diffInDays = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60 * 60 * 24));

  // Use relative time for posts less than 365 days old
  if (diffInDays < 365) {
    return formatSocialMediaTime(timestamp);
  }

  // Use absolute date for older posts
  return formatAbsoluteDate(timestamp);
}; 