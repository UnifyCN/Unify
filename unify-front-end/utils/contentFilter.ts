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

// Character substitution map: l33t speak + common Unicode homoglyphs
const CHAR_MAP: Record<string, string> = {
  // L33t speak
  '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't',
  '@': 'a', '$': 's',
  // Cyrillic lookalikes
  '\u0430': 'a', // а
  '\u0435': 'e', // е
  '\u043E': 'o', // о
  '\u0440': 'p', // р
  '\u0441': 'c', // с
  '\u0443': 'y', // у
  '\u0445': 'x', // х
  '\u0456': 'i', // і
  // Fullwidth ASCII
  '\uFF41': 'a', '\uFF42': 'b', '\uFF43': 'c', '\uFF44': 'd', '\uFF45': 'e',
  '\uFF46': 'f', '\uFF47': 'g', '\uFF48': 'h', '\uFF49': 'i', '\uFF4A': 'j',
  '\uFF4B': 'k', '\uFF4C': 'l', '\uFF4D': 'm', '\uFF4E': 'n', '\uFF4F': 'o',
  '\uFF50': 'p', '\uFF51': 'q', '\uFF52': 'r', '\uFF53': 's', '\uFF54': 't',
  '\uFF55': 'u', '\uFF56': 'v', '\uFF57': 'w', '\uFF58': 'x', '\uFF59': 'y',
  '\uFF5A': 'z',
  // Subscript/superscript digits
  '\u2070': '0', '\u00B9': '1', '\u00B2': '2', '\u00B3': '3',
  '\u2074': '4', '\u2075': '5', '\u2076': '6', '\u2077': '7',
  '\u2078': '8', '\u2079': '9',
  '\u2080': '0', '\u2081': '1', '\u2082': '2', '\u2083': '3',
  '\u2084': '4', '\u2085': '5', '\u2086': '6', '\u2087': '7',
  '\u2088': '8', '\u2089': '9',
  // Roman numeral lowercase
  '\u2170': 'i', '\u2171': 'ii', '\u2172': 'iii', '\u2173': 'iv', '\u2174': 'v',
};

// Zero-width and invisible characters to strip
const INVISIBLE_RE = /[\u200B\u200C\u200D\u2060\uFEFF\u00AD\u034F\u180E]/g;

function normalizeText(text: string): string {
  // 1. Unicode NFKC normalization (e.g., ﬁ → fi, ½ → 1/2)
  let normalized = text.normalize('NFKC');
  // 2. Strip zero-width / invisible characters
  normalized = normalized.replace(INVISIBLE_RE, '');
  // 3. Map homoglyphs and l33t speak
  return normalized
    .split('')
    .map(char => CHAR_MAP[char] || char)
    .join('');
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Pre-build regexes for each banned word for performance
const BANNED_REGEXES = BANNED_WORDS.map(
  word => new RegExp(`\\b${escapeRegex(word)}\\b`, 'i')
);

export interface ContentFilterResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Checks if text content is allowed (does not contain banned words).
 * Case-insensitive, handles basic l33t speak obfuscation.
 * Uses word-boundary matching to avoid overblocking.
 */
export function isContentAllowed(text: string): ContentFilterResult {
  if (!text || !text.trim()) {
    return { allowed: true };
  }

  const normalized = normalizeText(text.toLowerCase());

  for (const regex of BANNED_REGEXES) {
    if (regex.test(normalized)) {
      return {
        allowed: false,
        reason: 'Your post contains language that violates our Community Guidelines. Please revise and try again.',
      };
    }
  }

  return { allowed: true };
}
