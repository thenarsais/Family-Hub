/**
 * SendGrid Email Service
 * Sends emails for notifications, alerts, and communications
 */
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
export declare function sendEmail(options: EmailOptions): Promise<SendResult>;
/**
 * Send achievement notification email
 */
export declare function sendAchievementEmail(email: string, userName: string, badgeTitle: string, badgeEmoji: string): Promise<SendResult>;
/**
 * Send points awarded notification
 */
export declare function sendPointsEmail(email: string, userName: string, points: number, activity: string): Promise<SendResult>;
/**
 * Send daily summary email
 */
export declare function sendDailySummaryEmail(email: string, userName: string, dailyPoints: number, badgesEarned: number, streakDays: number): Promise<SendResult>;
/**
 * Send parent notification about child's progress
 */
export declare function sendParentNotificationEmail(email: string, parentName: string, childName: string, pointsEarned: number, badgesEarned: number): Promise<SendResult>;
/**
 * Send custom HTML email
 */
export declare function sendCustomEmail(email: string, subject: string, htmlContent: string): Promise<SendResult>;
declare const _default: {
    sendEmail: typeof sendEmail;
    sendAchievementEmail: typeof sendAchievementEmail;
    sendPointsEmail: typeof sendPointsEmail;
    sendDailySummaryEmail: typeof sendDailySummaryEmail;
    sendParentNotificationEmail: typeof sendParentNotificationEmail;
    sendCustomEmail: typeof sendCustomEmail;
};
export default _default;
//# sourceMappingURL=sendgrid.d.ts.map