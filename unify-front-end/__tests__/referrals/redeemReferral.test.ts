import { redeemReferral } from '@/services/referrals/redeemReferral';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: jest.fn(),
    },
  },
}));

import { supabase } from '@/lib/supabase';

const invokeMock = (supabase.functions.invoke as unknown) as jest.Mock;

describe('redeemReferral service', () => {
  beforeEach(() => {
    invokeMock.mockReset();
  });

  it('returns success payload from edge function', async () => {
    invokeMock.mockResolvedValueOnce({
      data: {
        success: true,
        inviter: {
          id: 'u1',
          username: 'Sarah',
          profile_picture_url: null,
          city: 'Toronto',
        },
        groups: [],
      },
      error: null,
    });

    const result = await redeemReferral('SARAHX', 'manual');
    expect(result).toEqual(
      expect.objectContaining({ success: true, inviter: expect.any(Object) })
    );
  });

  it('returns typed failure with reason when edge function returns one', async () => {
    invokeMock.mockResolvedValueOnce({
      data: { success: false, reason: 'self_referral' },
      error: null,
    });

    const result = await redeemReferral('SELFXX', 'manual');
    expect(result).toEqual({ success: false, reason: 'self_referral' });
  });

  it('uppercases and trims the code before sending', async () => {
    invokeMock.mockResolvedValueOnce({
      data: { success: false, reason: 'invalid_code' },
      error: null,
    });

    await redeemReferral('  sarahx  ', 'clipboard');
    expect(invokeMock).toHaveBeenCalledWith('redeem-referral', {
      body: { code: 'SARAHX', source: 'clipboard' },
    });
  });

  it('retries once on a 5xx-ish error and surfaces server_error if it persists', async () => {
    invokeMock
      .mockResolvedValueOnce({ data: null, error: { message: 'fail' } })
      .mockResolvedValueOnce({ data: null, error: { message: 'fail again' } });

    const result = await redeemReferral('XXXXXX', 'manual');
    expect(invokeMock).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ success: false, reason: 'server_error' });
  });

  it('returns server_error when function throws synchronously', async () => {
    invokeMock.mockRejectedValue(new Error('network'));
    const result = await redeemReferral('XXXXXX', 'manual');
    expect(result).toEqual({ success: false, reason: 'server_error' });
  });

  it('retries on first failure and succeeds on retry', async () => {
    invokeMock
      .mockResolvedValueOnce({ data: null, error: { message: 'transient' } })
      .mockResolvedValueOnce({
        data: {
          success: true,
          inviter: {
            id: 'u1',
            username: 'Sarah',
            profile_picture_url: null,
            city: null,
          },
          groups: [],
        },
        error: null,
      });

    const result = await redeemReferral('SARAHX', 'manual');
    expect(invokeMock).toHaveBeenCalledTimes(2);
    expect(result).toMatchObject({ success: true });
  });
});
