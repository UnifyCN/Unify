// \p{Extended_Pictographic} covers emoji glyphs across Unicode versions; the
// /u flag is required for property escapes. We also strip ZWJ + variation
// selectors that glue emoji sequences together so we don't leave orphans.
const EMOJI_REGEX = /[\p{Extended_Pictographic}‍️]/gu;

const MAX_LENGTH = 24;

export const sanitizeFirstName = (raw: string): string => {
  return raw
    .replace(EMOJI_REGEX, '')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, MAX_LENGTH);
};
