import { sendWelcomeEmail } from '@/services/onboarding/sendWelcomeEmail';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: jest.fn(),
    },
  },
}));

describe('sendWelcomeEmail service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('invokes the send-welcome-email edge function with an empty body', async () => {
    (supabase.functions.invoke as jest.Mock).mockResolvedValue({
      data: null,
      error: null,
    });

    await sendWelcomeEmail();

    expect(supabase.functions.invoke).toHaveBeenCalledTimes(1);
    expect(supabase.functions.invoke).toHaveBeenCalledWith(
      'send-welcome-email',
      { body: {} },
    );
  });

  it('rejects when the edge function returns an error', async () => {
    const fakeError = new Error('boom');
    (supabase.functions.invoke as jest.Mock).mockResolvedValue({
      data: null,
      error: fakeError,
    });

    await expect(sendWelcomeEmail()).rejects.toBe(fakeError);
  });
});
