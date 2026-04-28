// supabase/functions/_shared/companionTemplates.ts

// Mirrored from the edge function's OnboardingProfile so this file
// has zero Deno-specific imports and can be loaded by jest.
export interface OnboardingProfile {
  persona: string | null;
  city: string | null;
  province: string | null;
  arrival_date: string | null;
  stage: string | null;
  goals: string[];
  learning_interests: string[];
  hobbies: string[];
}

export type FeatherIconName =
  | 'map-pin' | 'briefcase' | 'home' | 'heart' | 'users'
  | 'book-open' | 'award' | 'flag' | 'file-text' | 'dollar-sign'
  | 'globe' | 'truck' | 'compass' | 'clipboard' | 'sun';

export interface PersonalizedStarter {
  id: string;
  category: string;
  iconName: FeatherIconName;
  iconBackground: string;
  prompt: string;
  priority: number;
}

export type TemplateFn = (profile: OnboardingProfile) => PersonalizedStarter | null;

export const CATEGORY_META: Record<
  string,
  { iconName: FeatherIconName; iconBackground: string }
> = {
  Vancouver:    { iconName: 'map-pin',     iconBackground: '#5C6BC0' },
  Toronto:      { iconName: 'map-pin',     iconBackground: '#5C6BC0' },
  Montreal:     { iconName: 'map-pin',     iconBackground: '#5C6BC0' },
  Calgary:      { iconName: 'map-pin',     iconBackground: '#5C6BC0' },
  Ottawa:       { iconName: 'map-pin',     iconBackground: '#5C6BC0' },
  'Your City':  { iconName: 'map-pin',     iconBackground: '#5C6BC0' },
  Settlement:   { iconName: 'compass',     iconBackground: '#66BB6A' },
  'Pre-Arrival':{ iconName: 'globe',       iconBackground: '#26A69A' },
  Documents:    { iconName: 'file-text',   iconBackground: '#F0A04B' },
  'Job Search': { iconName: 'briefcase',   iconBackground: '#EF5350' },
  Healthcare:   { iconName: 'heart',       iconBackground: '#66BB6A' },
  Housing:      { iconName: 'home',        iconBackground: '#26A69A' },
  'PR & Immigration': { iconName: 'award', iconBackground: '#5C6BC0' },
  Family:       { iconName: 'users',       iconBackground: '#E3A0C9' },
  Finance:      { iconName: 'dollar-sign', iconBackground: '#F0A04B' },
  Transit:      { iconName: 'truck',       iconBackground: '#26A69A' },
  Lifestyle:    { iconName: 'sun',         iconBackground: '#7C5CBF' },
  Education:    { iconName: 'book-open',   iconBackground: '#26A69A' },
  Citizenship:  { iconName: 'flag',        iconBackground: '#E3A0C9' },
};

export function makeStarter(
  id: string,
  category: keyof typeof CATEGORY_META,
  prompt: string,
  priority: number
): PersonalizedStarter {
  const meta = CATEGORY_META[category];
  return {
    id,
    category: category as string,
    iconName: meta.iconName,
    iconBackground: meta.iconBackground,
    prompt,
    priority,
  };
}

// Templates added in Task 2.
export const TEMPLATES: TemplateFn[] = [];

export function buildPool(profile: OnboardingProfile): PersonalizedStarter[] {
  const out: PersonalizedStarter[] = [];
  for (const fn of TEMPLATES) {
    const result = fn(profile);
    if (result) out.push(result);
  }
  // Sort priority desc; stable for ties (declaration order preserved).
  return out.sort((a, b) => b.priority - a.priority).slice(0, 30);
}
