/**
 * Client-side content filter for objectionable content.
 * Checks text against a banned words list before post creation.
 */

// Banned words list — slurs, hate speech, explicit content, threats
const BANNED_WORDS = [
  // Racial/ethnic slurs
  'nigger', 'nigga', 'chink', 'gook', 'spic', 'wetback', 'kike', 'beaner',
  'coon', 'darkie', 'raghead', 'towelhead', 'redskin', 'injun', 'jap',
  'cracker', 'honky', 'gringo', 'paki',
  // Homophobic/transphobic slurs
  'faggot', 'fag', 'dyke', 'tranny',
  // Sexist slurs
  'cunt', 'whore', 'slut',
  // Threats/violence
  'kill yourself', 'kys', 'go die',
  // Extremism
  'heil hitler', 'white power', 'white supremacy', 'death to',
];

// L33t speak substitutions for common obfuscation
const LEET_MAP: Record<string, string> = {
  '0': 'o',
  '1': 'i',
  '3': 'e',
  '4': 'a',
  '5': 's',
  '7': 't',
  '@': 'a',
  '$': 's',
};

function normalizeLeet(text: string): string {
  return text
    .split('')
    .map(char => LEET_MAP[char] || char)
    .join('');
}

export interface ContentFilterResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Checks if text content is allowed (does not contain banned words).
 * Case-insensitive, handles basic l33t speak obfuscation.
 */
export function isContentAllowed(text: string): ContentFilterResult {
  if (!text || !text.trim()) {
    return { allowed: true };
  }

  const normalized = normalizeLeet(text.toLowerCase());

  for (const word of BANNED_WORDS) {
    if (normalized.includes(word)) {
      return {
        allowed: false,
        reason: 'Your post contains language that violates our Community Guidelines. Please revise and try again.',
      };
    }
  }

  return { allowed: true };
}
