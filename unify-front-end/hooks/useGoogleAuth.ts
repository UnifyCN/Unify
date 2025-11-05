import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { supabase } from '../lib/supabase';

WebBrowser.maybeCompleteAuthSession();

export interface GoogleAuthResult {
  success: boolean;
  error?: string;
}

export function useGoogleAuth() {
  const signInWithGoogle = async (): Promise<GoogleAuthResult> => {
    try {
      const redirectUrl = makeRedirectUri({
        scheme: 'myapp',
      });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data?.url) {
        return { success: false, error: 'No authorization URL returned' };
      }

      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectUrl
      );
      
      if (result.type === 'success' && result.url) {
        const url = result.url;
        const hashFragment = url.split('#')[1];
        
        if (!hashFragment) {
          return { success: false, error: 'No tokens in callback URL' };
        }
        
        const params = new URLSearchParams(hashFragment);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        
        if (!accessToken || !refreshToken) {
          return { success: false, error: 'Missing tokens' };
        }
        
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        
        if (sessionError) {
          return { success: false, error: sessionError.message };
        }
        
        return { success: true };
        
      } else if (result.type === 'cancel') {
        return { success: false, error: 'Authentication cancelled' };
      } else {
        return { success: false, error: 'Authentication failed' };
      }
    } catch (error: any) {
      return { success: false, error: error?.message || 'OAuth flow failed' };
    }
  };

  return { signInWithGoogle };
}
