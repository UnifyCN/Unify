import {
  AICompanionBusyError,
  AICompanionLimitError,
  BUSY_FALLBACK_MESSAGE,
  DAILY_LIMIT_FALLBACK_MESSAGE,
  classifyRagQueryError,
} from '@/helpers/companion/ragQueryErrors';

describe('classifyRagQueryError', () => {
  describe('daily limit (429)', () => {
    it('maps a 429 with daily_limit_reached code to AICompanionLimitError', () => {
      const body = JSON.stringify({
        error: 'Daily message limit reached. Try again tomorrow.',
        code: 'daily_limit_reached',
      });
      const err = classifyRagQueryError(429, body);
      expect(err).toBeInstanceOf(AICompanionLimitError);
      expect((err as AICompanionLimitError).code).toBe('daily_limit_reached');
      expect(err.message).toBe('Daily message limit reached. Try again tomorrow.');
    });

    it('maps a bare 429 (no/invalid body) to AICompanionLimitError with fallback copy', () => {
      const err = classifyRagQueryError(429, '');
      expect(err).toBeInstanceOf(AICompanionLimitError);
      expect(err.message).toBe(DAILY_LIMIT_FALLBACK_MESSAGE);
    });

    it('maps the daily_limit_reached code even if the status is not 429', () => {
      const err = classifyRagQueryError(400, JSON.stringify({ code: 'daily_limit_reached' }));
      expect(err).toBeInstanceOf(AICompanionLimitError);
    });
  });

  describe('busy (503)', () => {
    it('maps a 503 with ai_companion_busy code to AICompanionBusyError', () => {
      const body = JSON.stringify({
        error: 'AI Companion is busy right now. Please try again in a minute.',
        code: 'ai_companion_busy',
      });
      const err = classifyRagQueryError(503, body);
      expect(err).toBeInstanceOf(AICompanionBusyError);
      expect(err.message).toContain('busy');
    });

    it('maps a bare 503 to AICompanionBusyError with fallback copy', () => {
      const err = classifyRagQueryError(503, '');
      expect(err).toBeInstanceOf(AICompanionBusyError);
      expect(err.message).toBe(BUSY_FALLBACK_MESSAGE);
    });
  });

  describe('other failures', () => {
    it('maps a 500 to a generic Error including status and body', () => {
      const err = classifyRagQueryError(500, '{"error":"boom"}');
      expect(err).toBeInstanceOf(Error);
      expect(err).not.toBeInstanceOf(AICompanionBusyError);
      expect(err).not.toBeInstanceOf(AICompanionLimitError);
      expect(err.message).toBe('rag-query 500: {"error":"boom"}');
    });

    it('maps a 401 with no body to a generic Error with just the status', () => {
      const err = classifyRagQueryError(401, '');
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toBe('rag-query 401');
    });

    it('does not throw on non-JSON bodies', () => {
      const err = classifyRagQueryError(502, '<html>Bad Gateway</html>');
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toBe('rag-query 502: <html>Bad Gateway</html>');
    });
  });
});
