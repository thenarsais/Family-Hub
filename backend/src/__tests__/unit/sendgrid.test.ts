describe('SendGridService', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
    global.fetch = jest.fn();
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  describe('sendEmail', () => {
    it('should reject when required fields are missing', async () => {
      const { sendEmail } = require('../../services/sendgrid');

      const result = await sendEmail({ to: '', subject: '', htmlContent: '' });

      expect(result).toEqual({
        success: false,
        error: 'Missing required email fields: to, subject, htmlContent',
      });
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should short-circuit in demo mode when no API key is configured', async () => {
      delete process.env.SENDGRID_API_KEY;
      const { sendEmail } = require('../../services/sendgrid');

      const result = await sendEmail({ to: 'a@b.com', subject: 'Hi', htmlContent: '<p>Hi</p>' });

      expect(result.success).toBe(true);
      expect(result.messageId).toMatch(/^demo-/);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should POST to SendGrid and return the message id when configured', async () => {
      process.env.SENDGRID_API_KEY = 'real-key';
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: { get: (name: string) => (name === 'x-message-id' ? 'msg-123' : null) },
      });
      const { sendEmail } = require('../../services/sendgrid');

      const result = await sendEmail({ to: 'a@b.com', subject: 'Hi', htmlContent: '<p>Hi</p>' });

      expect(result).toEqual({ success: true, messageId: 'msg-123' });
      const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toBe('https://api.sendgrid.com/v3/mail/send');
      expect(init.headers.Authorization).toBe('Bearer real-key');
      const body = JSON.parse(init.body);
      expect(body.personalizations[0].to).toEqual([{ email: 'a@b.com' }]);
      expect(body.content).toEqual([{ type: 'text/html', value: '<p>Hi</p>' }]);
    });

    it('should include a text/plain part when textContent is provided', async () => {
      process.env.SENDGRID_API_KEY = 'real-key';
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'msg-123' },
      });
      const { sendEmail } = require('../../services/sendgrid');

      await sendEmail({ to: 'a@b.com', subject: 'Hi', htmlContent: '<p>Hi</p>', textContent: 'Hi' });

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.content).toEqual([
        { type: 'text/html', value: '<p>Hi</p>' },
        { type: 'text/plain', value: 'Hi' },
      ]);
    });

    it('should return an error result when the API responds with a failure', async () => {
      process.env.SENDGRID_API_KEY = 'real-key';
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Unauthorized',
        text: async () => 'bad key',
      });
      const { sendEmail } = require('../../services/sendgrid');

      const result = await sendEmail({ to: 'a@b.com', subject: 'Hi', htmlContent: '<p>Hi</p>' });

      expect(result).toEqual({ success: false, error: 'SendGrid API error: Unauthorized' });
    });

    it('should return an error result when fetch throws', async () => {
      process.env.SENDGRID_API_KEY = 'real-key';
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('network error'));
      const { sendEmail } = require('../../services/sendgrid');

      const result = await sendEmail({ to: 'a@b.com', subject: 'Hi', htmlContent: '<p>Hi</p>' });

      expect(result).toEqual({ success: false, error: 'network error' });
    });
  });

  describe('templated senders', () => {
    beforeEach(() => {
      delete process.env.SENDGRID_API_KEY; // exercise demo mode to avoid re-mocking fetch per test
    });

    it('sendAchievementEmail should build a badge email', async () => {
      const { sendAchievementEmail } = require('../../services/sendgrid');

      const result = await sendAchievementEmail('a@b.com', 'Sam', 'Early Bird', '🐦');

      expect(result.success).toBe(true);
    });

    it('sendPointsEmail should build a points email', async () => {
      const { sendPointsEmail } = require('../../services/sendgrid');

      const result = await sendPointsEmail('a@b.com', 'Sam', 25, 'Chores');

      expect(result.success).toBe(true);
    });

    it('sendDailySummaryEmail should build a summary email', async () => {
      const { sendDailySummaryEmail } = require('../../services/sendgrid');

      const result = await sendDailySummaryEmail('a@b.com', 'Sam', 25, 2, 5);

      expect(result.success).toBe(true);
    });

    it('sendParentNotificationEmail should build a parent update email', async () => {
      const { sendParentNotificationEmail } = require('../../services/sendgrid');

      const result = await sendParentNotificationEmail('parent@b.com', 'Jo', 'Sam', 25, 2);

      expect(result.success).toBe(true);
    });

    it('sendCustomEmail should pass through the given subject and content', async () => {
      const { sendCustomEmail } = require('../../services/sendgrid');

      const result = await sendCustomEmail('a@b.com', 'Custom subject', '<p>Custom</p>');

      expect(result.success).toBe(true);
    });
  });
});
