import * as Notifications from 'expo-notifications';
import { registerForPushNotifications } from '@/services/push/pushNotifications';

jest.mock('expo-device', () => ({ isDevice: true }));
jest.mock('expo-application', () => ({ nativeApplicationVersion: '1.0.0' }));
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
}));
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null } }) },
    from: jest.fn(),
  },
}));

const getPermissions = Notifications.getPermissionsAsync as jest.Mock;
const requestPermissions = Notifications.requestPermissionsAsync as jest.Mock;

describe('registerForPushNotifications permission flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('prompts when the status is undetermined and reports the grant', async () => {
    getPermissions.mockResolvedValue({ status: 'undetermined', canAskAgain: true });
    requestPermissions.mockResolvedValue({ status: 'granted' });
    (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({
      data: 'ExponentPushToken[abc]',
    });

    const result = await registerForPushNotifications();

    expect(requestPermissions).toHaveBeenCalledTimes(1);
    expect(result.prompted).toBe(true);
    expect(result.previousPermission).toBe('undetermined');
    expect(result.permission).toBe('granted');
  });

  it('does not re-request or report a prompt when iOS already denied', async () => {
    getPermissions.mockResolvedValue({ status: 'denied', canAskAgain: false });

    const result = await registerForPushNotifications();

    expect(requestPermissions).not.toHaveBeenCalled();
    expect(result.prompted).toBe(false);
    expect(result.permission).toBe('denied');
    expect(result.token).toBeNull();
  });

  it('re-prompts on platforms that allow asking again after a denial', async () => {
    getPermissions.mockResolvedValue({ status: 'denied', canAskAgain: true });
    requestPermissions.mockResolvedValue({ status: 'denied' });

    const result = await registerForPushNotifications();

    expect(requestPermissions).toHaveBeenCalledTimes(1);
    expect(result.prompted).toBe(true);
    expect(result.permission).toBe('denied');
  });

  it('skips the prompt entirely when already granted', async () => {
    getPermissions.mockResolvedValue({ status: 'granted', canAskAgain: false });
    (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({
      data: 'ExponentPushToken[abc]',
    });

    const result = await registerForPushNotifications();

    expect(requestPermissions).not.toHaveBeenCalled();
    expect(result.prompted).toBe(false);
    expect(result.permission).toBe('granted');
  });
});
