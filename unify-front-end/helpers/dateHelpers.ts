export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
  });
};

export const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

export const formatEventDate = (dateString: string) => {
  if (!dateString) {
    return '';
  }
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

export const formatEventTimeRange = (startDate: string, endDate: string) => {
  if (!endDate) {
    return formatTime(startDate);
  }
  return `${formatTime(startDate)} - ${formatTime(endDate)} PST`;
};

export const calculateUserStage = (givenTime: Date): number => {
  const currentTime = new Date();

  // If given time is in the future, return 0
  if (givenTime > currentTime) {
    return 0;
  }

  // Calculate difference in months
  const diffInMs = currentTime.getTime() - givenTime.getTime();
  const diffInMonths = diffInMs / (1000 * 60 * 60 * 24 * 30.44); // Average days per month

  if (diffInMonths < 3) {
    return 1;
  } else if (diffInMonths < 12) {
    return 2;
  } else if (diffInMonths < 36) {
    return 3;
  } else {
    return 4;
  }
};

export const stageNumberToEnum = (stageNumber: number): string => {
  return stageNumber.toString();
};

export const stageEnumToNumber = (stageEnum: string): number => {
  return parseInt(stageEnum, 10) || 0;
};
