type PoolPersona = 'international_student' | 'skilled_worker' | 'refugee' | 'other';
type PoolTimeInCanada =
  | 'not_arrived'
  | 'less_than_1_year'
  | '1_to_2_years'
  | '2_to_3_years'
  | '3_plus_years';

export const COMMUNITY_CIRCLE_SIZE = 4;
export const COMMUNITY_CIRCLE_DURATION_DAYS = 14;

export const PERSONA_LABELS: Record<PoolPersona, string> = {
  international_student: 'International Students',
  skilled_worker: 'Skilled Workers',
  refugee: 'Refugees & Protected Persons',
  other: 'Newcomers',
};

export const TIME_IN_CANADA_LABELS: Record<PoolTimeInCanada, string> = {
  not_arrived: "Haven't arrived yet",
  less_than_1_year: 'New to Canada (<1 year)',
  '1_to_2_years': 'Living in Canada (1-2 years)',
  '2_to_3_years': 'Living in Canada (2-3 years)',
  '3_plus_years': 'Living in Canada (3+ years)',
};

export type PoolKey = string;

export const buildPoolKey = (
  persona: PoolPersona,
  timeInCanada: PoolTimeInCanada
): PoolKey => `${persona}__${timeInCanada}`;

export const formatPersonaLabel = (persona?: PoolPersona | null) => {
  if (!persona) {
    return 'Newcomers';
  }
  return PERSONA_LABELS[persona] ?? persona.replace(/_/g, ' ');
};

export const formatTimeInCanadaLabel = (
  timeInCanada?: PoolTimeInCanada | null
) => {
  if (!timeInCanada) {
    return 'Time in Canada (unspecified)';
  }
  return TIME_IN_CANADA_LABELS[timeInCanada] ?? timeInCanada.replace(/_/g, ' ');
};

export const getPoolLabel = (
  persona?: PoolPersona | null,
  timeInCanada?: PoolTimeInCanada | null
) => `${formatPersonaLabel(persona)} • ${formatTimeInCanadaLabel(timeInCanada)}`;

export type MatchingPersona = PoolPersona;
export type MatchingTimeInCanada = PoolTimeInCanada;
