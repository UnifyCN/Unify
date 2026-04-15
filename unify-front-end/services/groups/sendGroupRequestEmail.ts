import { supabase } from '@/lib/supabase';

type GroupRequestPayload = {
  groupName: string;
  audience: string;
  reason: string;
  requesterEmail: string;
  extraNotes?: string;
};

export async function sendGroupRequestEmail(payload: GroupRequestPayload) {
  const { data, error } = await supabase.functions.invoke('request-group', {
    body: payload,
  });

  if (error) {
    throw new Error(error.message ?? 'Edge function failed.');
  }

  return data;
}
