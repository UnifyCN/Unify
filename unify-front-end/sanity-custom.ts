const projectId =
  process.env.EXPO_PUBLIC_SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID;
const dataset =
  process.env.EXPO_PUBLIC_SANITY_DATASET ||
  process.env.SANITY_DATASET ||
  'production';
const apiVersion = '2023-05-03';

// Custom Sanity client using direct HTTP requests
export const sanityClient = {
  fetch: async (query: string, params: any = {}) => {
    try {
      const baseUrl = `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}`;
      const url = new URL(baseUrl);
      url.searchParams.set('query', query);

      // Sanity API doesn't support params query parameter
      // We need to replace the parameters in the query string directly
      let processedQuery = query;
      if (Object.keys(params).length > 0) {
        Object.keys(params).forEach(key => {
          const value = params[key];
          if (typeof value === 'string') {
            processedQuery = processedQuery.replace(
              new RegExp(`\\$${key}`, 'g'),
              `"${value}"`
            );
          } else {
            processedQuery = processedQuery.replace(
              new RegExp(`\\$${key}`, 'g'),
              JSON.stringify(value)
            );
          }
        });
      }
      url.searchParams.set('query', processedQuery);

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

// Helper function to get image URL
// Helper function to get image URL
export const urlFor = (source: any) => {
  if (source && source.asset && source.asset._ref) {
    const imageId = source.asset._ref
      .replace('image-', '')
      .replace('-jpg', '.jpg')
      .replace('-png', '.png')
      .replace('-webp', '.webp');
    return `https://cdn.sanity.io/images/${projectId}/${dataset}/${imageId}`;
  }
  return '';
};
