import {
  parseInviteCode,
  isInviteCode,
  clipboardPayload,
  formatInviteMessage,
  buildShareUrl,
  INVITE_CLIPBOARD_PREFIX,
} from '@/utils/inviteLink';
import { APP_STORE_URL } from '@/constants/appStore';

describe('inviteLink utils', () => {
  describe('parseInviteCode', () => {
    it('matches a bare 6-char A-Z+2-9 code', () => {
      expect(parseInviteCode('ABCDEF')).toBe('ABCDEF');
      expect(parseInviteCode('A2B3C4')).toBe('A2B3C4');
      expect(parseInviteCode('XYZ234')).toBe('XYZ234');
    });

    it('extracts a code prefixed with the clipboard marker', () => {
      expect(parseInviteCode('unify-invite:ABCDEF')).toBe('ABCDEF');
      expect(parseInviteCode('unify-invite:Z9X8Y7')).toBe('Z9X8Y7');
    });

    it('extracts a code surrounded by other text', () => {
      expect(parseInviteCode('hey check this unify-invite:HJKLMN later')).toBe('HJKLMN');
    });

    it('returns null for short or long codes', () => {
      expect(parseInviteCode('ABCDE')).toBeNull(); // 5
      expect(parseInviteCode('ABCDEFG')).toBeNull(); // 7
    });

    it('returns null for ambiguous chars (0/O/I/1)', () => {
      expect(parseInviteCode('ABCDE0')).toBeNull();
      expect(parseInviteCode('ABCDEO')).toBeNull();
      expect(parseInviteCode('ABCDEI')).toBeNull();
      expect(parseInviteCode('ABCDE1')).toBeNull();
    });

    it('returns null for lowercase codes (we expect uppercase only)', () => {
      expect(parseInviteCode('abcdef')).toBeNull();
    });

    it('returns null for null / undefined / empty', () => {
      expect(parseInviteCode(null)).toBeNull();
      expect(parseInviteCode(undefined)).toBeNull();
      expect(parseInviteCode('')).toBeNull();
    });

    it('returns null for clipboard strings without our prefix', () => {
      expect(parseInviteCode('some-other-app:ABCDEF')).toBeNull();
    });
  });

  describe('isInviteCode', () => {
    it('matches valid codes', () => {
      expect(isInviteCode('SARAHX')).toBe(true);
    });
    it('rejects invalid codes', () => {
      expect(isInviteCode('SARAHO')).toBe(false); // O not allowed
      expect(isInviteCode('sarahx')).toBe(false);
      expect(isInviteCode('123')).toBe(false);
    });
  });

  describe('clipboardPayload', () => {
    it('prefixes the code with the canonical marker', () => {
      expect(clipboardPayload('ABCDEF')).toBe(`${INVITE_CLIPBOARD_PREFIX}ABCDEF`);
    });
  });

  describe('formatInviteMessage', () => {
    it('uses username + city when both present', () => {
      const msg = formatInviteMessage({
        username: 'Sarah',
        city: 'Toronto',
        code: 'YQAR67',
      });
      expect(msg).toContain('Sarah from Toronto');
      expect(msg).toContain('Unify');
      expect(msg).toContain(APP_STORE_URL);
    });

    it('omits city when null', () => {
      const msg = formatInviteMessage({
        username: 'Sarah',
        city: null,
        code: 'YQAR67',
      });
      expect(msg).toContain('Sarah ');
      expect(msg).not.toContain('from null');
      expect(msg).not.toContain('from undefined');
    });

    it('falls back to "A friend" when username is empty', () => {
      const msg = formatInviteMessage({
        username: '   ',
        city: null,
        code: 'YQAR67',
      });
      expect(msg).toContain('A friend');
    });

    it('embeds the invite code in the message body so recipients can paste manually', () => {
      const msg = formatInviteMessage({
        username: 'Sarah',
        city: null,
        code: 'YQAR67',
      });
      expect(msg).toContain('YQAR67');
    });
  });

  describe('buildShareUrl', () => {
    it('returns the App Store URL', () => {
      expect(buildShareUrl()).toBe(APP_STORE_URL);
      expect(buildShareUrl()).toMatch(/apps\.apple\.com\/ca\/app\/.+\/id\d+$/);
    });
  });
});
