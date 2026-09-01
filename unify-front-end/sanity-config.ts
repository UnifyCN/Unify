const projectId =
  process.env.EXPO_PUBLIC_SANITY_PROJECT_ID ||
  process.env.SANITY_PROJECT_ID ||
  'placeholder';
const dataset =
  process.env.EXPO_PUBLIC_SANITY_DATASET ||
  process.env.SANITY_DATASET ||
  'production';

export const SANITY_CLIENT_CONFIG = {
  projectId,
  dataset,
  apiVersion: '2024-01-01',
  useCdn: true,
  perspective: 'published' as const,
};

export const SANITY_PROJECT_ID = projectId;
export const SANITY_DATASET = dataset;
