import { SANITY_CLIENT_CONFIG } from '@/sanity-config';

describe('Sanity client', () => {
  it('always reads published content and lets the SDK encode query params', () => {
    expect(SANITY_CLIENT_CONFIG).toMatchObject({
      apiVersion: '2024-01-01',
      perspective: 'published',
      useCdn: true,
    });
  });
});
