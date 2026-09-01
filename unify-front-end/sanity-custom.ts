import { createClient } from '@sanity/client';
import {
  SANITY_CLIENT_CONFIG,
  SANITY_DATASET,
  SANITY_PROJECT_ID,
} from './sanity-config';

export { SANITY_CLIENT_CONFIG } from './sanity-config';

/** The SDK serializes GROQ parameters separately instead of interpolating them. */
export const sanityClient = createClient(SANITY_CLIENT_CONFIG);

export const urlFor = (source: any) => {
  if (source && source.asset && source.asset._ref) {
    const imageId = source.asset._ref
      .replace('image-', '')
      .replace('-jpg', '.jpg')
      .replace('-png', '.png')
      .replace('-webp', '.webp');
    return `https://cdn.sanity.io/images/${SANITY_PROJECT_ID}/${SANITY_DATASET}/${imageId}`;
  }
  return '';
};
