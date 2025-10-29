// Custom Sanity client for React Native compatibility
// This handles the "@sanity/client/csm" error by avoiding the problematic import
let sanityClient: any;
let imageBuilder: any;

// Use direct HTTP client to avoid React Native compatibility issues
const projectId =
  process.env.EXPO_PUBLIC_SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID;
const dataset =
  process.env.EXPO_PUBLIC_SANITY_DATASET ||
  process.env.SANITY_DATASET ||
  'production';
const apiVersion = '2023-05-03';

sanityClient = {
  fetch: async (query: string, params: any = {}) => {
    try {
      const baseUrl = `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}`;
      const url = new URL(baseUrl);
      url.searchParams.set('query', query);

      if (Object.keys(params).length > 0) {
        url.searchParams.set('params', JSON.stringify(params));
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(
          `Sanity API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      return data.result || [];
    } catch (error) {
      console.error('Sanity fetch error:', error);
      throw error;
    }
  },
};

// Custom image builder to avoid Sanity client dependencies
imageBuilder = {
  image: (source: any) => {
    if (source && source.asset && source.asset._ref) {
      const imageId = source.asset._ref
        .replace('image-', '')
        .replace('-jpg', '.jpg')
        .replace('-png', '.png')
        .replace('-webp', '.webp');
      return `https://cdn.sanity.io/images/${projectId}/${dataset}/${imageId}`;
    }
    return '';
  },
};

// Helper function to get image URL
export const urlFor = (source: any) => imageBuilder.image(source);

export default sanityClient;
