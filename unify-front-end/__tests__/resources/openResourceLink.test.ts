import { openResourceLink } from '@/utils/openResourceLink';

describe('openResourceLink', () => {
  it('tracks only after the opener succeeds', async () => {
    const order: string[] = [];
    const opened = await openResourceLink(
      () => 'https://example.com',
      async url => {
        order.push(`open:${url}`);
      },
      () => order.push('track')
    );

    expect(opened).toBe(true);
    expect(order).toEqual(['open:https://example.com', 'track']);
  });

  it('does not open or track when URL construction fails', async () => {
    const open = jest.fn(async () => undefined);
    const track = jest.fn();

    const opened = await openResourceLink(
      () => {
        throw new Error('invalid URL');
      },
      open,
      track
    );

    expect(opened).toBe(false);
    expect(open).not.toHaveBeenCalled();
    expect(track).not.toHaveBeenCalled();
  });

  it('does not track when the opener rejects', async () => {
    const track = jest.fn();
    const opened = await openResourceLink(
      () => 'https://example.com',
      async () => {
        throw new Error('browser unavailable');
      },
      track
    );

    expect(opened).toBe(false);
    expect(track).not.toHaveBeenCalled();
  });
});
