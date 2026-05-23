import * as TrackingTransparency from 'expo-tracking-transparency';
import * as SecureStore from 'expo-secure-store';

const mockInitializeSDK = jest.fn();
const mockSetAdvertiserTrackingEnabled = jest.fn();

jest.mock('react-native-fbsdk-next', () => ({
  Settings: {
    initializeSDK: () => mockInitializeSDK(),
    setAdvertiserTrackingEnabled: (v: boolean) =>
      mockSetAdvertiserTrackingEnabled(v),
  },
}));

jest.mock('expo-tracking-transparency', () => ({
  requestTrackingPermissionsAsync: jest.fn(),
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
}));

import { initMetaSDK } from '@/services/analytics/initMetaSDK';

const requestTracking =
  TrackingTransparency.requestTrackingPermissionsAsync as jest.Mock;
const getItem = SecureStore.getItemAsync as jest.Mock;
const setItem = SecureStore.setItemAsync as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  getItem.mockResolvedValue(null);
  setItem.mockResolvedValue(undefined);
});

describe('initMetaSDK', () => {
  it('requests ATT and initializes SDK with tracking enabled on granted', async () => {
    requestTracking.mockResolvedValueOnce({ status: 'granted' });
    await initMetaSDK({ requestATT: true });
    expect(requestTracking).toHaveBeenCalledTimes(1);
    expect(mockInitializeSDK).toHaveBeenCalledTimes(1);
    expect(mockSetAdvertiserTrackingEnabled).toHaveBeenCalledWith(true);
    expect(setItem).toHaveBeenCalledWith('meta_att_status', 'granted');
  });

  it('initializes SDK with tracking disabled on denied/restricted/notDetermined', async () => {
    for (const status of ['denied', 'restricted', 'undetermined'] as const) {
      jest.clearAllMocks();
      requestTracking.mockResolvedValueOnce({ status });
      await initMetaSDK({ requestATT: true });
      expect(mockSetAdvertiserTrackingEnabled).toHaveBeenCalledWith(false);
    }
  });

  it('skips ATT request when requestATT is false (user tapped "Not now")', async () => {
    await initMetaSDK({ requestATT: false });
    expect(requestTracking).not.toHaveBeenCalled();
    expect(mockInitializeSDK).toHaveBeenCalledTimes(1);
    expect(mockSetAdvertiserTrackingEnabled).toHaveBeenCalledWith(false);
  });

  it('does not re-request ATT if a terminal decision is already persisted', async () => {
    getItem.mockResolvedValueOnce('granted');
    await initMetaSDK({ requestATT: true });
    expect(requestTracking).not.toHaveBeenCalled();
    expect(mockInitializeSDK).toHaveBeenCalledTimes(1);
    expect(mockSetAdvertiserTrackingEnabled).toHaveBeenCalledWith(true);
  });

  it('re-requests ATT when persisted value is "skipped" (non-terminal)', async () => {
    getItem.mockResolvedValueOnce('skipped');
    requestTracking.mockResolvedValueOnce({ status: 'granted' });
    await initMetaSDK({ requestATT: true });
    expect(requestTracking).toHaveBeenCalledTimes(1);
    expect(mockSetAdvertiserTrackingEnabled).toHaveBeenCalledWith(true);
    expect(setItem).toHaveBeenCalledWith('meta_att_status', 'granted');
  });

  it('does not persist non-terminal statuses', async () => {
    requestTracking.mockResolvedValueOnce({ status: 'undetermined' });
    await initMetaSDK({ requestATT: true });
    expect(setItem).not.toHaveBeenCalled();
    expect(mockSetAdvertiserTrackingEnabled).toHaveBeenCalledWith(false);
  });
});
