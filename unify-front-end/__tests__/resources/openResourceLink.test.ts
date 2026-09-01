import { launchResourceLink } from '@/utils/openResourceLink';

describe('launchResourceLink', () => {
  it('records intent after URL validation and before native launch', async () => {
    const order: string[] = [];
    const opened = await launchResourceLink({
      buildUrl: () => {
        order.push('build');
        return 'https://example.com';
      },
      onIntent: () => order.push('intent'),
      launch: async url => {
        order.push(`launch:${url}`);
      },
    });

    expect(opened).toBe(true);
    expect(order).toEqual(['build', 'intent', 'launch:https://example.com']);
  });

  it('reports invalid URLs without recording intent or launching', async () => {
    const launch = jest.fn(async () => undefined);
    const intent = jest.fn();
    const failure = jest.fn();

    const opened = await launchResourceLink({
      buildUrl: () => {
        throw new Error('invalid URL');
      },
      launch,
      onIntent: intent,
      onFailure: failure,
    });

    expect(opened).toBe(false);
    expect(launch).not.toHaveBeenCalled();
    expect(intent).not.toHaveBeenCalled();
    expect(failure).toHaveBeenCalledWith('invalid_url');
  });

  it('keeps click intent and reports native launch failures separately', async () => {
    const intent = jest.fn();
    const failure = jest.fn();
    const opened = await launchResourceLink({
      buildUrl: () => 'https://example.com',
      launch: async () => {
        throw new Error('browser unavailable');
      },
      onIntent: intent,
      onFailure: failure,
    });

    expect(opened).toBe(false);
    expect(intent).toHaveBeenCalledTimes(1);
    expect(failure).toHaveBeenCalledWith('launch_failed');
  });

  it('does not let analytics failures block navigation', async () => {
    const launch = jest.fn(async () => undefined);
    const opened = await launchResourceLink({
      buildUrl: () => 'https://example.com',
      launch,
      onIntent: () => {
        throw new Error('analytics unavailable');
      },
    });

    expect(opened).toBe(true);
    expect(launch).toHaveBeenCalledWith('https://example.com');
  });
});
