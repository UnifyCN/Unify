import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import { logPushPermissionGranted } from '@/services/analytics/metaEvents';

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface PushRegistrationResult {
  token: string | null;
  /** Permission status BEFORE we asked (used to detect first-prompt). */
  previousPermission: Notifications.PermissionStatus | 'unsupported';
  /** Permission status AFTER our request (or existing if no request was made). */
  permission: Notifications.PermissionStatus | 'unsupported';
  /** True iff we actually showed the system prompt this call. */
  prompted: boolean;
}

/**
 * Register for push notifications and store the token in Supabase.
 * Returns a result describing the permission flow + the token (when granted).
 */
export async function registerForPushNotifications(): Promise<PushRegistrationResult> {
  // Push notifications only work on physical devices
  if (!Device.isDevice) {
    console.warn('[Push] Skipped: not a physical device');
    return {
      token: null,
      previousPermission: 'unsupported',
      permission: 'unsupported',
      prompted: false,
    };
  }

  // Check existing permission status
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  let prompted = false;

  // Request permission if not already granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
    prompted = true;
    if (status === 'granted') {
      // Analytics must not abort push registration if it throws.
      try {
        const deviceId =
          Platform.OS === 'ios'
            ? (await Application.getIosIdForVendorAsync()) ?? 'unknown-device'
            : (Application.getAndroidId() ?? 'unknown-device');
        await logPushPermissionGranted(deviceId);
      } catch (err) {
        console.warn('[meta] logPushPermissionGranted failed', err);
      }
    }
  }

  if (finalStatus !== 'granted') {
    console.warn('[Push] Skipped: permission not granted, status:', finalStatus);
    return {
      token: null,
      previousPermission: existingStatus,
      permission: finalStatus,
      prompted,
    };
  }

  // Create Android notification channels
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('social', {
      name: 'Social Activity',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });
    await Notifications.setNotificationChannelAsync('circles', {
      name: 'Community Circles',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });
    await Notifications.setNotificationChannelAsync('learn', {
      name: 'Learning Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
    });
  }

  try {
    // Get Expo push token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: '3772d4d9-79dd-4848-9691-bae1b19eefb8', // From app.json eas.projectId
    });

    const token = tokenData.data;
    console.log('[Push] Token obtained:', token);

    // Store token in Supabase
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.warn('[Push] No authenticated user, skipping token storage');
      return {
        token,
        previousPermission: existingStatus,
        permission: finalStatus,
        prompted,
      };
    }

    if (!token) {
      console.warn('[Push] Token is empty, skipping storage');
      return {
        token: null,
        previousPermission: existingStatus,
        permission: finalStatus,
        prompted,
      };
    }

    // First try to update existing token for this user on this platform
    const { data: existing } = await supabase
      .from('push_tokens')
      .select('id, token')
      .eq('user_id', user.id)
      .eq('platform', Platform.OS)
      .maybeSingle();

    if (existing && existing.token === token) {
      // Token unchanged, just update timestamp
      await supabase
        .from('push_tokens')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', existing.id);
      console.log('[Push] Token unchanged, updated timestamp');
    } else if (existing) {
      // Token changed — delete old and insert new
      await supabase.from('push_tokens').delete().eq('id', existing.id);
      const { error } = await supabase.from('push_tokens').insert({
        user_id: user.id,
        token,
        platform: Platform.OS,
        updated_at: new Date().toISOString(),
      });
      if (error) {
        console.error('[Push] Failed to store updated token:', error.message, error.code, error.details);
      } else {
        console.log('[Push] Token updated successfully');
      }
    } else {
      // No existing token — insert new
      const { error } = await supabase.from('push_tokens').insert({
        user_id: user.id,
        token,
        platform: Platform.OS,
        updated_at: new Date().toISOString(),
      });
      if (error) {
        console.error('[Push] Failed to store new token:', error.message, error.code, error.details);
      } else {
        console.log('[Push] Token registered successfully');
      }
    }

    return {
      token,
      previousPermission: existingStatus,
      permission: finalStatus,
      prompted,
    };
  } catch (error) {
    console.error('[Push] Registration failed:', error);
    return {
      token: null,
      previousPermission: existingStatus,
      permission: finalStatus,
      prompted,
    };
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
