/**
 * Regression guard for the Meta (Facebook) SDK config plugin.
 *
 * Bug: autoLogAppEventsEnabled was false, so standard app events (install,
 * app launch) were never auto-logged and nothing showed up in Events Manager.
 * These must stay enabled for ad-campaign attribution to work.
 */

// Neutralize dotenv so app.config.js cannot pull real values from a local .env
// file. The test controls process.env entirely, keeping every case deterministic.
jest.mock('dotenv', () => ({ config: jest.fn() }));

describe('app.config.js — Meta SDK plugin', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    // dotenv does not override already-set vars, so seeding these here makes
    // the plugin branch in app.config.js evaluate deterministically.
    process.env = {
      ...ORIGINAL_ENV,
      META_APP_ID: '1234567890',
      META_CLIENT_TOKEN: 'test_client_token',
    };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  const getFbsdkPluginOptions = () => {
    // Dynamic require so jest.resetModules() can re-evaluate the config against
    // the per-test process.env. A static import would be cached once.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const config = require('../../app.config.js');
    const plugins: unknown[] = config.expo.plugins;
    const entry = plugins.find(
      p => Array.isArray(p) && p[0] === 'react-native-fbsdk-next'
    ) as [string, Record<string, unknown>] | undefined;
    return entry?.[1];
  };

  it('includes the fbsdk plugin when META env vars are present', () => {
    expect(getFbsdkPluginOptions()).toBeDefined();
  });

  it('auto-logs app events so installs/launches reach Events Manager', () => {
    expect(getFbsdkPluginOptions()?.autoLogAppEventsEnabled).toBe(true);
  });

  it('collects the advertiser ID for attribution', () => {
    expect(getFbsdkPluginOptions()?.advertiserIDCollectionEnabled).toBe(true);
  });

  it('keeps auto-init off (SDK is initialized in JS at startup instead)', () => {
    expect(getFbsdkPluginOptions()?.isAutoInitEnabled).toBe(false);
  });

  it('wires appID, clientToken, and scheme from env', () => {
    const opts = getFbsdkPluginOptions();
    expect(opts?.appID).toBe('1234567890');
    expect(opts?.clientToken).toBe('test_client_token');
    expect(opts?.scheme).toBe('fb1234567890');
  });

  it('drops the plugin entirely when META env vars are missing', () => {
    process.env = { ...ORIGINAL_ENV };
    delete process.env.META_APP_ID;
    delete process.env.META_CLIENT_TOKEN;
    jest.resetModules();
    expect(getFbsdkPluginOptions()).toBeUndefined();
  });
});
