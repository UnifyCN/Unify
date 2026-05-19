import { updateFirstName } from '@/services/users/updateFirstName';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => {
  const eqMock = jest.fn();
  const updateMock = jest.fn(() => ({ eq: eqMock }));
  const fromMock = jest.fn(() => ({ update: updateMock }));
  return {
    supabase: {
      auth: { getUser: jest.fn() },
      from: fromMock,
      __mocks: { eqMock, updateMock, fromMock },
    },
  };
});

const mocks = (supabase as any).__mocks;

describe('updateFirstName service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: 'user-123' } },
    });
  });

  it('sanitizes input and updates public.users.first_name', async () => {
    mocks.eqMock.mockResolvedValue({ error: null });

    const result = await updateFirstName('  Savar  ');

    expect(result.success).toBe(true);
    expect(mocks.fromMock).toHaveBeenCalledWith('users');
    expect(mocks.updateMock).toHaveBeenCalledWith({ first_name: 'Savar' });
    expect(mocks.eqMock).toHaveBeenCalledWith('id', 'user-123');
  });

  it('rejects when sanitized value is empty', async () => {
    const result = await updateFirstName('   🌸   ');

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/required/i);
    expect(mocks.fromMock).not.toHaveBeenCalled();
  });

  it('rejects when there is no authenticated user', async () => {
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: null },
    });

    const result = await updateFirstName('Savar');

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/auth/i);
  });

  it('returns supabase error message when UPDATE fails', async () => {
    mocks.eqMock.mockResolvedValue({
      error: { message: 'permission denied' },
    });

    const result = await updateFirstName('Savar');

    expect(result.success).toBe(false);
    expect(result.error).toBe('permission denied');
  });
});
