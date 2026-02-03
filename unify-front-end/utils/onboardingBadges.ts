import { deriveTimeInCanadaFromArrivalDate } from '@/matching/pools';
import { Persona } from '@/types/onboardingProfile';

export type TimeInCanadaRange =
  | 'less_than_1_year'
  | 'one_to_three_years'
  | 'three_plus_years';

export type BadgeIconName =
  | 'book-open'
  | 'briefcase'
  | 'shield'
  | 'user'
  | 'calendar';

export interface BadgeColors {
  backgroundColor: string;
  textColor: string;
}

export const TIME_IN_CANADA_RANGE_LABELS: Record<TimeInCanadaRange, string> = {
  less_than_1_year: 'Less than 1 year',
  one_to_three_years: '1-3 years',
  three_plus_years: '3+ years',
};

const PERSONA_LABELS: Record<Exclude<Persona, 'other'>, string> = {
  international_student: 'International student',
  skilled_worker: 'Skilled worker',
  refugee: 'Refugee',
};

const PERSONA_ICON_NAMES: Record<Persona, BadgeIconName> = {
  international_student: 'book-open',
  skilled_worker: 'briefcase',
  refugee: 'shield',
  other: 'user',
};

const PERSONA_COLORS: Record<Persona, BadgeColors> = {
  international_student: {
    backgroundColor: '#EAF2FF',
    textColor: '#2F5DA9',
  },
  skilled_worker: {
    backgroundColor: '#EAF7EE',
    textColor: '#2E7D32',
  },
  refugee: {
    backgroundColor: '#FFF1E6',
    textColor: '#C25A00',
  },
  other: {
    backgroundColor: '#F2F2F2',
    textColor: '#5B5B5B',
  },
};

const TIME_IN_CANADA_COLORS: Record<TimeInCanadaRange, BadgeColors> = {
  less_than_1_year: {
    backgroundColor: '#E8F7FF',
    textColor: '#1E6A8A',
  },
  one_to_three_years: {
    backgroundColor: '#F3ECFF',
    textColor: '#5A3FA6',
  },
  three_plus_years: {
    backgroundColor: '#FFF4E5',
    textColor: '#B36B00',
  },
};

export const deriveTimeInCanadaRange = (
  arrivalDate: string | null | undefined
): TimeInCanadaRange | null => {
  const timeInCanada = deriveTimeInCanadaFromArrivalDate(arrivalDate);

  if (!timeInCanada) {
    return null;
  }

  switch (timeInCanada) {
    case 'less_than_1_year':
      return 'less_than_1_year';
    case '1_to_2_years':
    case '2_to_3_years':
      return 'one_to_three_years';
    case '3_plus_years':
      return 'three_plus_years';
    case 'not_arrived':
    default:
      return null;
  }
};

export const getPersonaBadgeInfo = (
  persona: Persona | null | undefined,
  personaOther?: string | null
): {
  label: string;
  iconName: BadgeIconName;
  colors: BadgeColors;
} | null => {
  if (!persona) {
    return null;
  }

  if (persona === 'other') {
    const trimmedOther = personaOther?.trim();
    return {
      label: trimmedOther ? trimmedOther : 'Newcomer',
      iconName: PERSONA_ICON_NAMES.other,
      colors: PERSONA_COLORS.other,
    };
  }

  return {
    label: PERSONA_LABELS[persona] ?? 'Newcomer',
    iconName: PERSONA_ICON_NAMES[persona],
    colors: PERSONA_COLORS[persona],
  };
};

export const getTimeInCanadaBadgeInfo = (
  arrivalDate: string | null | undefined
): {
  label: string;
  iconName: BadgeIconName;
  range: TimeInCanadaRange;
  colors: BadgeColors;
} | null => {
  const range = deriveTimeInCanadaRange(arrivalDate);

  if (!range) {
    return null;
  }

  return {
    range,
    label: TIME_IN_CANADA_RANGE_LABELS[range],
    iconName: 'calendar',
    colors: TIME_IN_CANADA_COLORS[range],
  };
};
