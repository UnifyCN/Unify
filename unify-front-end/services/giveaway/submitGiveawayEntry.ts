import { supabase } from '@/lib/supabase';
import { GIVEAWAY, isGiveawayActive } from '@/constants/Giveaway';
import type { GiveawayEntryInput, GiveawaySubmitResult } from './types';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function submitGiveawayEntry(
  input: GiveawayEntryInput
): Promise<GiveawaySubmitResult> {
  if (!isGiveawayActive()) {
    return { success: false, reason: 'expired' };
  }

  const trimmed = {
    shortAnswer: input.shortAnswer.trim(),
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    email: input.email.trim(),
    phone: input.phone?.trim() || undefined,
    skillAnswer: input.skillAnswer?.trim() || undefined,
  };

  if (!trimmed.shortAnswer) {
    return { success: false, reason: 'validation', message: 'short_answer_required' };
  }
  if (trimmed.shortAnswer.length > GIVEAWAY.shortAnswerMaxLength) {
    return { success: false, reason: 'validation', message: 'short_answer_too_long' };
  }
  if (!trimmed.firstName) {
    return { success: false, reason: 'validation', message: 'first_name_required' };
  }
  if (!trimmed.lastName) {
    return { success: false, reason: 'validation', message: 'last_name_required' };
  }
  if (!trimmed.email || !EMAIL_REGEX.test(trimmed.email)) {
    return { success: false, reason: 'validation', message: 'email_invalid' };
  }

  if (GIVEAWAY.enableSkillQuestion) {
    if (!trimmed.skillAnswer) {
      return {
        success: false,
        reason: 'validation',
        message: 'skill_answer_required',
      };
    }
    if (trimmed.skillAnswer.replace(/\s/g, '') !== GIVEAWAY.skillAnswer) {
      return {
        success: false,
        reason: 'validation',
        message: 'skill_answer_incorrect',
      };
    }
  }

  if (input.termsAccepted !== true) {
    return { success: false, reason: 'validation', message: 'consent_required' };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return { success: false, reason: 'unauthorized' };
  }

  const { data, error } = await supabase
    .from('giveaway_entries')
    .insert({
      user_id: user.id,
      campaign_id: GIVEAWAY.campaignId,
      short_answer: trimmed.shortAnswer,
      first_name: trimmed.firstName,
      last_name: trimmed.lastName,
      email: trimmed.email,
      phone: trimmed.phone ?? null,
      skill_answer: trimmed.skillAnswer ?? null,
      terms_accepted: true,
    })
    .select()
    .single();

  if (error) {
    // 23505 = unique_violation → duplicate entry
    if (error.code === '23505') {
      return { success: false, reason: 'duplicate' };
    }
    if (__DEV__) {
      console.error('[giveaway] submit failed', error);
    }
    return { success: false, reason: 'server_error', message: error.message };
  }

  // Fire-and-forget confirmation email. The entry is already persisted; the
  // email is a nice-to-have, not a gate. Errors are logged in the edge fn.
  void supabase.functions
    .invoke('giveaway-confirm', {
      body: { campaignId: GIVEAWAY.campaignId },
    })
    .catch(emailError => {
      if (__DEV__) {
        console.warn('[giveaway] confirmation email failed', emailError);
      }
    });

  return { success: true, entry: data };
}
