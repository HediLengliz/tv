import nodemailer from 'nodemailer';

// SMTP configuration
export const emailTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER || 'onlyleesin147@gmail.com',
        pass: process.env.SMTP_PASSWORD || 'wdkpmuqxdvljbhes'
    }
});

// Email templates
export function getVerificationEmailTemplate(user: any, verificationToken: string) {
    const verificationUrl = `${process.env.APP_URL || 'http://localhost:5000'}/verify-email?token=${verificationToken}`;

    return {
        from: `"TV Content Manager" <${process.env.SMTP_USER || 'onlyleesin147@gmail.com'}>`,
        to: user.email,
        subject: "Verify Your Email Address",
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to TV Content Manager!</h2>
        <p>Hello ${user.firstName} ${user.lastName},</p>
        <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        <p>If you didn't create this account, you can safely ignore this email.</p>
        <p>Regards,<br>TV Content Manager Team</p>
      </div>
    `
    };

}
