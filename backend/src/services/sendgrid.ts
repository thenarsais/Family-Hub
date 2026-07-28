/**
 * SendGrid Email Service
 * Sends emails for notifications, alerts, and communications
 */

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || '';
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@familyhub.com';
const SENDGRID_BASE_URL = 'https://api.sendgrid.com/v3/mail/send';

interface EmailOptions {
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  fromEmail?: string;
  fromName?: string;
}

interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send email via SendGrid
 */
export async function sendEmail(options: EmailOptions): Promise<SendResult> {
  // Validate inputs
  if (!options.to || !options.subject || !options.htmlContent) {
    return {
      success: false,
      error: 'Missing required email fields: to, subject, htmlContent'
    };
  }

  // Demo mode - don't send if API key is missing
  if (!SENDGRID_API_KEY || SENDGRID_API_KEY === '') {
    console.log(`[DEMO] Email would be sent to: ${options.to}`);
    console.log(`[DEMO] Subject: ${options.subject}`);
    return {
      success: true,
      messageId: 'demo-' + Date.now(),
      error: undefined
    };
  }

  try {
    const payload = {
      personalizations: [
        {
          to: [{ email: options.to }],
          subject: options.subject
        }
      ],
      from: {
        email: options.fromEmail || SENDGRID_FROM_EMAIL,
        name: options.fromName || 'Family Hub'
      },
      content: [
        {
          type: 'text/html',
          value: options.htmlContent
        },
        ...(options.textContent
          ? [
              {
                type: 'text/plain',
                value: options.textContent
              }
            ]
          : [])
      ]
    };

    const response = await fetch(SENDGRID_BASE_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('SendGrid error:', error);
      return {
        success: false,
        error: `SendGrid API error: ${response.statusText}`
      };
    }

    // Extract message ID from response headers
    const messageId = response.headers.get('x-message-id') || 'unknown';

    console.log(`Email sent to ${options.to} (ID: ${messageId})`);

    return {
      success: true,
      messageId
    };
  } catch (error: any) {
    console.error('Failed to send email:', error);
    return {
      success: false,
      error: error.message || 'Unknown error'
    };
  }
}

/**
 * Send achievement notification email
 */
export async function sendAchievementEmail(
  email: string,
  userName: string,
  badgeTitle: string,
  badgeEmoji: string
): Promise<SendResult> {
  const htmlContent = `
    <html>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <h2>🎉 Achievement Unlocked!</h2>
        <p>Hi ${userName},</p>
        <p>Congratulations! You've earned a new badge:</p>
        <div style="background-color: #f0f0f0; padding: 20px; border-radius: 8px; text-align: center;">
          <div style="font-size: 48px;">${badgeEmoji}</div>
          <h3>${badgeTitle}</h3>
        </div>
        <p>Keep up the great work!</p>
        <p>Best regards,<br>The Family Hub Team</p>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `🎉 You've earned the ${badgeTitle} badge!`,
    htmlContent
  });
}

/**
 * Send points awarded notification
 */
export async function sendPointsEmail(
  email: string,
  userName: string,
  points: number,
  activity: string
): Promise<SendResult> {
  const htmlContent = `
    <html>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <h2>✨ Points Earned!</h2>
        <p>Hi ${userName},</p>
        <p>You've earned <strong>${points} points</strong> for completing <strong>${activity}</strong>!</p>
        <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-weight: bold;">+${points} Points</p>
        </div>
        <p>Keep working towards your goals!</p>
        <p>Best regards,<br>The Family Hub Team</p>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `✨ You earned ${points} points!`,
    htmlContent
  });
}

/**
 * Send daily summary email
 */
export async function sendDailySummaryEmail(
  email: string,
  userName: string,
  dailyPoints: number,
  badgesEarned: number,
  streakDays: number
): Promise<SendResult> {
  const htmlContent = `
    <html>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <h2>📊 Daily Summary</h2>
        <p>Hi ${userName},</p>
        <p>Here's your activity summary for today:</p>
        <div style="background-color: #f0f0f0; padding: 20px; border-radius: 8px;">
          <table style="width: 100%;">
            <tr>
              <td style="padding: 10px;"><strong>Points Earned:</strong></td>
              <td style="padding: 10px; text-align: right; font-size: 18px; color: #28a745;">${dailyPoints}</td>
            </tr>
            <tr>
              <td style="padding: 10px;"><strong>Badges Unlocked:</strong></td>
              <td style="padding: 10px; text-align: right; font-size: 18px; color: #ffc107;">${badgesEarned}</td>
            </tr>
            <tr>
              <td style="padding: 10px;"><strong>Current Streak:</strong></td>
              <td style="padding: 10px; text-align: right; font-size: 18px; color: #007bff;">${streakDays} days 🔥</td>
            </tr>
          </table>
        </div>
        <p>Great job today! Keep it up tomorrow!</p>
        <p>Best regards,<br>The Family Hub Team</p>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: '📊 Your Daily Summary',
    htmlContent
  });
}

/**
 * Send parent notification about child's progress
 */
export async function sendParentNotificationEmail(
  email: string,
  parentName: string,
  childName: string,
  pointsEarned: number,
  badgesEarned: number
): Promise<SendResult> {
  const htmlContent = `
    <html>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <h2>👨‍👩‍👧 ${childName}'s Progress Update</h2>
        <p>Hi ${parentName},</p>
        <p><strong>${childName}</strong> has been active today! Here's the summary:</p>
        <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px;">
          <p><strong>Points Earned:</strong> ${pointsEarned} 🌟</p>
          <p><strong>Badges Unlocked:</strong> ${badgesEarned} 🏆</p>
        </div>
        <p>Keep encouraging ${childName}'s progress!</p>
        <p>Best regards,<br>The Family Hub Team</p>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `👨‍👩‍👧 ${childName}'s Activity Update`,
    htmlContent
  });
}

/**
 * Send custom HTML email
 */
export async function sendCustomEmail(
  email: string,
  subject: string,
  htmlContent: string
): Promise<SendResult> {
  return sendEmail({
    to: email,
    subject,
    htmlContent
  });
}

export default {
  sendEmail,
  sendAchievementEmail,
  sendPointsEmail,
  sendDailySummaryEmail,
  sendParentNotificationEmail,
  sendCustomEmail
};
