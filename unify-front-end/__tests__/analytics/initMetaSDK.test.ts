import * as TrackingTransparency from 'expo-tracking-transparency';

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
  getTrackingPermissionsAsync: jest.fn(),
}));

// Imported after jest.mock() so the mocks are registered first.
// eslint-disable-next-line import/first
import {
  initMetaSDK,
  promptATTForReturningUsers,
} from '@/services/analytics/initMetaSDK';

const requestTracking =
  TrackingTransparency.requestTrackingPermissionsAsync as jest.Mock;
const getTracking =
  TrackingTransparency.getTrackingPermissionsAsync as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('initMetaSDK', () => {
  describe('onboarding (requestATT: true)', () => {
    it('requests ATT and enables tracking when granted', async () => {
      requestTracking.mockResolvedValueOnce({ status: 'granted' });
      await initMetaSDK({ requestATT: true });
      expect(requestTracking).toHaveBeenCalledTimes(1);
      expect(getTracking).not.toHaveBeenCalled();
      expect(mockInitializeSDK).toHaveBeenCalledTimes(1);
      expect(mockSetAdvertiserTrackingEnabled).toHaveBeenCalledWith(true);
    });

    it('initializes with tracking disabled when not granted', async () => {
      for (const status of ['denied', 'restricted', 'undetermined'] as const) {
        jest.clearAllMocks();
        requestTracking.mockResolvedValueOnce({ status });
        await initMetaSDK({ requestATT: true });
        expect(mockInitializeSDK).toHaveBeenCalledTimes(1);
        expect(mockSetAdvertiserTrackingEnabled).toHaveBeenCalledWith(false);
      }
    });
  });

  describe('startup (requestATT: false)', () => {
    it('reads the live OS status without prompting', async () => {
      getTracking.mockResolvedValueOnce({ status: 'granted' });
      await initMetaSDK({ requestATT: false });
      expect(getTracking).toHaveBeenCalledTimes(1);
      expect(requestTracking).not.toHaveBeenCalled();
      expect(mockInitializeSDK).toHaveBeenCalledTimes(1);
      expect(mockSetAdvertiserTrackingEnabled).toHaveBeenCalledWith(true);
    });

    it('disables tracking when the live OS status is not granted', async () => {
      getTracking.mockResolvedValueOnce({ status: 'denied' });
      await initMetaSDK({ requestATT: false });
      expect(requestTracking).not.toHaveBeenCalled();
      expect(mockInitializeSDK).toHaveBeenCalledTimes(1);
      expect(mockSetAdvertiserTrackingEnabled).toHaveBeenCalledWith(false);
    });

    it('honors a Settings change to "granted" on a later launch', async () => {
      // User denied at first, then enabled tracking in iPhone Settings. The
      // next startup read sees the live "granted" status and turns tracking on.
      getTracking.mockResolvedValueOnce({ status: 'granted' });
      await initMetaSDK({ requestATT: false });
      expect(mockSetAdvertiserTrackingEnabled).toHaveBeenCalledWith(true);
    });
  });

  describe('promptATTForReturningUsers', () => {
    it('prompts when the user was never asked (undetermined)', async () => {
      getTracking.mockResolvedValueOnce({ status: 'undetermined' });
      requestTracking.mockResolvedValueOnce({ status: 'granted' });
      await promptATTForReturningUsers();
      expect(requestTracking).toHaveBeenCalledTimes(1);
      expect(mockInitializeSDK).toHaveBeenCalledTimes(1);
      expect(mockSetAdvertiserTrackingEnabled).toHaveBeenCalledWith(true);
    });

    it('does nothing when the user already answered', async () => {
      for (const status of ['granted', 'denied', 'restricted'] as const) {
        jest.clearAllMocks();
        getTracking.mockResolvedValueOnce({ status });
        await promptATTForReturningUsers();
        expect(requestTracking).not.toHaveBeenCalled();
        expect(mockInitializeSDK).not.toHaveBeenCalled();
      }
    });
  });
});
