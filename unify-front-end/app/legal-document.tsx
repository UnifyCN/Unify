import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import LegalWebView from '@/components/LegalWebView';
import { LEGAL_URLS, LEGAL_TITLES, LegalDocumentType } from '@/utils/legalUrls';

/**
 * Route: /legal-document?doc=privacyPolicy|communityGuidelines
 * Displays legal documents in an in-app WebView.
 */
export default function LegalDocumentScreen() {
  const router = useRouter();
  const { doc } = useLocalSearchParams<{ doc: LegalDocumentType }>();

  // Default to privacy policy if invalid or missing
  const documentType: LegalDocumentType =
    doc && doc in LEGAL_URLS ? doc : 'privacyPolicy';

  const url = LEGAL_URLS[documentType];
  const title = LEGAL_TITLES[documentType];

  const handleClose = () => {
    router.back();
  };

  return <LegalWebView url={url} title={title} onClose={handleClose} />;
}
