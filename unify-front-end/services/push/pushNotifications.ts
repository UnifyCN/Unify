import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Register for push notifications and store the token in Supabase.
 * Returns the Expo push token if successful, null otherwise.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  // Push notifications only work on physical devices
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  // Check existing permission status
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request permission if not already granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission not granted');
    return null;
  }

  try {
    // Get Expo push token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: '3772d4d9-79dd-4848-9691-bae1b19eefb8', // From app.json eas.projectId
    });

    const token = tokenData.data;

    // Store token in Supabase
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user && token) {
      const { error } = await supabase.from('push_tokens').upsert(
        {
          user_id: user.id,
          token,
          platform: Platform.OS,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,token',
        }
      );

      if (error) {
        console.error('Failed to store push token', error);
      } else {
        console.log('Push token registered successfully');
      }
    }

    return token;
  } catch (error) {
    console.error('Failed to get push token', error);
    return null;
  }
}

/**
 * Unregister the current push token from Supabase.
 * Call this when user logs out.
 */
export async function unregisterPushToken(): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: '3772d4d9-79dd-4848-9691-bae1b19eefb8',
    });

    await supabase
      .from('push_tokens')
      .delete()
      .eq('user_id', user.id)
      .eq('token', tokenData.data);

    console.log('Push token unregistered');
  } catch (error) {
    console.error('Failed to unregister push token', error);
  }
}

/**
 * Add a listener for when a notification is received while app is foregrounded.
 */
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
) {
  return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Add a listener for when user taps on a notification.
 */
export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
) {
  return Notifications.addNotificationResponseReceivedListener(callback);
}
