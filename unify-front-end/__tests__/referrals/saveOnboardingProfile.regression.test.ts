/**
 * REGRESSION TEST (critical, per /plan-eng-review test plan):
 *
 *  saveOnboardingProfile must:
 *   1. Return a valid profile even when redeem-referral fails — onboarding completion
 *      cannot be blocked by a referral edge function failure.
 *   2. Skip redeem entirely when no inviteCode is passed.
 *   3. Skip redeem when onboarding_completed is false (avoid stray redeems on partial saves).
 */

import { saveOnboardingProfile } from '@/services/onboarding/saveOnboardingProfile';

const profileRow = {
  id: 'invitee-id',
  persona: null,
  persona_other: null,
  referral_source: null,
  referral_source_other: null,
  arrival_date: null,
  city: null,
  province: null,
  stage: null,
  goals: [],
  goals_other: null,
  learning_interests: [],
  learning_interests_other: null,
  hobbies: [],
  wants_reminders: false,
  onboarding_completed: true,
  onboarding_completed_at: null,
  created_at: '2026-04-28T00:00:00Z',
  updated_at: '2026-04-28T00:00:00Z',
};

jest.mock('@/lib/supabase', () => {
  const upsertMock = jest.fn();
  return {
    supabase: {
      from: jest.fn(() => ({
        upsert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: upsertMock,
          })),
        })),
      })),
    },
    __upsertMock: upsertMock,
  };
});

const mockedRedeem = jest.fn();
jest.mock('@/services/referrals/redeemReferral', () => ({
  redeemReferral: (code: string, source: 'clipboard' | 'manual') =>
    mockedRedeem(code, source),
}));

const supabaseMock = jest.requireMock('@/lib/supabase') as {
  supabase: { from: jest.Mock };
  __upsertMock: jest.Mock;
};

describe('saveOnboardingProfile regression: redeem failures must not block save', () => {
  beforeEach(() => {
    mockedRedeem.mockReset();
    supabaseMock.__upsertMock.mockReset();
    supabaseMock.__upsertMock.mockResolvedValue({ data: profileRow, error: null });
  });

  it('returns profile with redeem.success=true on happy path', async () => {
    mockedRedeem.mockResolvedValue({
      success: true,
      inviter: { id: 'u1', username: 'Sarah', profile_picture_url: null, city: null },
      groups: [],
    });

    const result = await saveOnboardingProfile(
      'invitee-id',
      { onboarding_completed: true },
      { inviteCode: { code: 'SARAHX', source: 'manual' } }
    );

    expect(result.profile.id).toBe('invitee-id');
    expect(result.redeem?.success).toBe(true);
  });

  it('returns valid profile + redeem.success=false when redeem fails — onboarding NOT blocked', async () => {
    mockedRedeem.mockResolvedValue({ success: false, reason: 'invalid_code' });

    const result = await saveOnboardingProfile(
      'invitee-id',
      { onboarding_completed: true },
      { inviteCode: { code: 'BADCDE', source: 'manual' } }
    );

    expect(result.profile.id).toBe('invitee-id'); // critical: profile still saved
    expect(result.redeem?.success).toBe(false);
  });

  it('returns valid profile when redeem throws — caller must still complete onboarding', async () => {
    mockedRedeem.mockRejectedValue(new Error('network exploded'));

    const result = await saveOnboardingProfile(
      'invitee-id',
      { onboarding_completed: true },
      { inviteCode: { code: 'SARAHX', source: 'manual' } }
    );

    expect(result.profile.id).toBe('invitee-id'); // critical
    expect(result.redeem).toEqual({ success: false, reason: 'server_error' });
  });

  it('skips redeem entirely when no inviteCode is passed (no regression for non-referral users)', async () => {
    const result = await saveOnboardingProfile('invitee-id', {
      onboarding_completed: true,
    });

    expect(result.profile.id).toBe('invitee-id');
    expect(result.redeem).toBeUndefined();
    expect(mockedRedeem).not.toHaveBeenCalled();
  });

  it('skips redeem when onboarding_completed is false (no stray redeems on partial saves)', async () => {
    const result = await saveOnboardingProfile(
      'invitee-id',
      { onboarding_completed: false },
      { inviteCode: { code: 'SARAHX', source: 'manual' } }
    );

    expect(result.redeem).toBeUndefined();
    expect(mockedRedeem).not.toHaveBeenCalled();
    expect(result.profile.id).toBe('invitee-id');
  });
});
