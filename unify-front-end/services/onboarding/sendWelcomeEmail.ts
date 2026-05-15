import { supabase } from '@/lib/supabase';

export const sendWelcomeEmail = async (): Promise<void> => {
  const { error } = await supabase.functions.invoke('send-welcome-email', {
    body: {},
  });
  if (error) throw error;
};
