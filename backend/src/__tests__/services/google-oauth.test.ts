/**
 * Google OAuth Service Tests — disconnectCalendar()
 *
 * Regression coverage for TASK-004: disconnectCalendar() used to call
 * Google's token-revoke endpoint and let a failure there (very common —
 * revoking an already-expired or already-revoked token returns 400) abort
 * the whole function before the code that marks the integration inactive
 * in the database ever ran. That left a user with a dead token stuck
 * "connected" forever, unable to actually disconnect, which meant the
 * frontend's recovery path (fall back to local-only events once
 * disconnected) could never be reached.
 */

process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'placeholder-service-role-key';

interface MockChain {
  from: jest.Mock;
  select: jest.Mock;
  update: jest.Mock;
  eq: jest.Mock;
  single: jest.Mock;
  then: (resolve: (value: { error: unknown }) => void) => void;
}

const mockChain: MockChain = {
  from: jest.fn(),
  select: jest.fn(),
  update: jest.fn(),
  eq: jest.fn(),
  single: jest.fn(),
  then: () => {},
};
mockChain.from.mockReturnValue(mockChain);
mockChain.select.mockReturnValue(mockChain);
mockChain.update.mockReturnValue(mockChain);
mockChain.eq.mockReturnValue(mockChain);
// The update path never calls .single() — supabase-js query builders are
// themselves thenable, so `await ...eq().eq()` resolves via this.
let updateResolution: { error: unknown } = { error: null };
mockChain.then = (resolve) => resolve(updateResolution);

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockChain),
}));
jest.mock('axios');

import axios from 'axios';
import { getGoogleOAuthService } from '../../services/google-oauth';

describe('GoogleOAuthService.disconnectCalendar', () => {
  const userId = 'user-123';
  const service = getGoogleOAuthService();

  beforeEach(() => {
    jest.clearAllMocks();
    mockChain.from.mockReturnValue(mockChain);
    mockChain.select.mockReturnValue(mockChain);
    mockChain.update.mockReturnValue(mockChain);
    mockChain.eq.mockReturnValue(mockChain);
    updateResolution = { error: null };
  });

  it('marks the integration inactive even when the Google revoke call fails', async () => {
    mockChain.single.mockResolvedValueOnce({
      data: {
        access_token: 'expired-token',
        refresh_token: null,
        token_expires_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      },
      error: null,
    });
    (axios.post as jest.Mock).mockRejectedValueOnce({
      response: { status: 400, data: { error: 'invalid_token' } },
    });

    await expect(service.disconnectCalendar(userId)).resolves.toBeUndefined();

    expect(axios.post).toHaveBeenCalledWith(
      'https://oauth2.googleapis.com/revoke',
      null,
      expect.objectContaining({ params: { token: 'expired-token' } }),
    );
    expect(mockChain.update).toHaveBeenCalledWith({ is_active: false });
  });

  it('skips the revoke call entirely when no token is on file', async () => {
    mockChain.single.mockResolvedValueOnce({ data: null, error: { message: 'not found' } });

    await expect(service.disconnectCalendar(userId)).resolves.toBeUndefined();

    expect(axios.post).not.toHaveBeenCalled();
    expect(mockChain.update).toHaveBeenCalledWith({ is_active: false });
  });

  it('still revokes and disconnects cleanly when the token is valid', async () => {
    mockChain.single.mockResolvedValueOnce({
      data: {
        access_token: 'live-token',
        refresh_token: 'refresh-token',
        token_expires_at: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
      },
      error: null,
    });
    (axios.post as jest.Mock).mockResolvedValueOnce({ status: 200 });

    await expect(service.disconnectCalendar(userId)).resolves.toBeUndefined();

    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(mockChain.update).toHaveBeenCalledWith({ is_active: false });
  });

  it('still throws when marking the integration inactive itself fails', async () => {
    mockChain.single.mockResolvedValueOnce({ data: null, error: { message: 'not found' } });
    updateResolution = { error: { message: 'db unavailable' } };

    await expect(service.disconnectCalendar(userId)).rejects.toEqual({ message: 'db unavailable' });
  });
});
