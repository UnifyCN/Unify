export type TimeOfDayBucket = 'morning' | 'afternoon' | 'evening';

export const getTimeOfDayGreeting = (
  now: Date = new Date()
): TimeOfDayBucket => {
  const hour = now.getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  return 'evening';
};
