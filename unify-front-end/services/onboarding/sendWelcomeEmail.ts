import { supabase } from '@/lib/supabase';

export const sendWelcomeEmail = async (): Promise<void> => {
  const { data, error } = await supabase.functions.invoke('send-welcome-email', {
    body: {},
  });
  if (error) throw error;
  // Edge function returns HTTP 200 with `{ success: false, error: '...' }` for
  // application-level failures (no_email, resend_failed, resend_timeout). Log
  // the payload so those don't go unnoticed even though we stay fire-and-forget.
  console.log('[welcome] edge function response', data);
};
