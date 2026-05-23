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

  it('clears first_name to NULL when sanitized value is empty', async () => {
    mocks.eqMock.mockResolvedValue({ error: null });

    const result = await updateFirstName('   🌸   ');

    expect(result.success).toBe(true);
    expect(mocks.updateMock).toHaveBeenCalledWith({ first_name: null });
  });

  it('clears first_name to NULL on explicit empty string', async () => {
    mocks.eqMock.mockResolvedValue({ error: null });

    const result = await updateFirstName('');

    expect(result.success).toBe(true);
    expect(mocks.updateMock).toHaveBeenCalledWith({ first_name: null });
  });

  it('returns NOT_AUTHENTICATED when there is no auth user', async () => {
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: null },
    });

    const result = await updateFirstName('Savar');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe('NOT_AUTHENTICATED');
    }
  });

  it('returns DB_ERROR with message when UPDATE fails', async () => {
    mocks.eqMock.mockResolvedValue({
      error: { message: 'permission denied' },
    });

    const result = await updateFirstName('Savar');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe('DB_ERROR');
      expect(result.message).toBe('permission denied');
    }
  });
});
