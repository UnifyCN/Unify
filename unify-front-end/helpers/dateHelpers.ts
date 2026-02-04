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

/** Map app stage (0–4) to Sanity stage slug for checklist (exactly 5 values) */
export const stageNumberToStageSlug = (stage: number): string => {
  switch (stage) {
    case 0:
      return 'not_arrived';
    case 1:
      return 'arrived_0_3_months';
    case 2:
      return 'months_3_12';
    case 3:
      return 'years_1_3';
    case 4:
      return 'years_3_plus';
    default:
      return 'arrived_0_3_months';
  }
};

/** Allowed persona slugs for Sanity checklist (exactly 6). Unknown → null so we do not pass to GROQ. */
const CHECKLIST_PERSONA_SLUGS = [
  'international_student',
  'refugee',
  'protected_person',
  'skilled_worker',
  'immigrant',
  'pr',
] as const;

export const normalizePersonaSlug = (persona: string | null): string | null => {
  if (!persona) return null;
  const p = persona.toLowerCase().trim();
  return CHECKLIST_PERSONA_SLUGS.includes(p as (typeof CHECKLIST_PERSONA_SLUGS)[number])
    ? p
    : null;
};
