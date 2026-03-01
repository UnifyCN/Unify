/**
 * Centralized legal document URLs.
 * Used by LegalWebView, SignUp, and Settings.
 */
export const LEGAL_URLS = {
  privacyPolicy:
    'https://www.notion.so/Unify-s-Privacy-Policy-2e15af89dddb80b0b37ee497e6d4e38c',
  communityGuidelines:
    'https://www.notion.so/Unify-s-Community-Guidelines-2e55af89dddb8098aff0d1460b3fb694',
  termsOfService:
    'https://www.notion.so/Unify-s-Terms-of-Service-PLACEHOLDER',
} as const;

export type LegalDocumentType = keyof typeof LEGAL_URLS;

export const LEGAL_TITLES: Record<LegalDocumentType, string> = {
  privacyPolicy: 'Privacy Policy',
  communityGuidelines: 'Community Guidelines',
  termsOfService: 'Terms of Service',
};
