import * as SecureStore from 'expo-secure-store';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
}));

const mockLogEvent = jest.fn();
jest.mock('react-native-fbsdk-next', () => ({
  AppEventsLogger: {
    logEvent: (...args: unknown[]) => mockLogEvent(...args),
    AppEvents: { CompletedRegistration: 'fb_mobile_complete_registration' },
  },
  Settings: {},
}));

import {
  logActivation,
  logCompanionFirstMessage,
  logGroupJoined,
  logFirstPostCreated,
  logPushPermissionGranted,
  logAccountCreated,
} from '@/services/analytics/metaEvents';

const getItem = SecureStore.getItemAsync as jest.Mock;
const setItem = SecureStore.setItemAsync as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  getItem.mockResolvedValue(null);
  setItem.mockResolvedValue(undefined);
});

describe('metaEvents dedupe', () => {
  it('fires the event the first time and sets a flag', async () => {
    await logActivation('user-1');
    expect(mockLogEvent).toHaveBeenCalledWith('fb_mobile_complete_registration');
    expect(setItem).toHaveBeenCalledWith(
      'meta_event_fired:activation:user-1',
      '1',
    );
  });

  it('does not fire when the flag is already set', async () => {
    getItem.mockResolvedValueOnce('1');
    await logActivation('user-1');
    expect(mockLogEvent).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
  });

  it('keys dedupe by user id so a different user fires again', async () => {
    getItem.mockImplementation(async (k: string) =>
      k === 'meta_event_fired:activation:user-1' ? '1' : null,
    );
    await logActivation('user-2');
    expect(mockLogEvent).toHaveBeenCalledTimes(1);
  });

  it('logs each event type with the correct event name', async () => {
    await logCompanionFirstMessage('u');
    await logGroupJoined('u');
    await logFirstPostCreated('u');
    await logPushPermissionGranted('device-1');
    await logAccountCreated('u');

    expect(mockLogEvent.mock.calls.map((c) => c[0])).toEqual([
      'unify_companion_first_message',
      'unify_group_joined',
      'unify_first_post_created',
      'unify_push_permission_granted',
      'unify_account_created',
    ]);
  });

  it('swallows SecureStore errors silently (event becomes a no-op)', async () => {
    getItem.mockRejectedValueOnce(new Error('keychain locked'));
    await expect(logActivation('user-1')).resolves.not.toThrow();
    expect(mockLogEvent).not.toHaveBeenCalled();
  });
});
