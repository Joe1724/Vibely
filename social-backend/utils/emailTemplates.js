// social-backend/utils/emailTemplates.js

const getEmailTemplate = (title, content) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';
          background-color: #f4f4f5;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background-color: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
        }
        .header {
          background-color: #4f46e5;
          padding: 24px;
          text-align: center;
        }
        .header h1 {
          color: #ffffff;
          margin: 0;
          font-size: 24px;
        }
        .content {
          padding: 32px;
          color: #334155;
          line-height: 1.6;
        }
        .content p {
          margin: 0 0 16px;
        }
        .otp-code {
          display: inline-block;
          background-color: #f1f5f9;
          color: #1e293b;
          font-size: 20px;
          font-weight: bold;
          padding: 12px 24px;
          border-radius: 6px;
          letter-spacing: 2px;
          margin: 16px 0;
        }
        .button {
          display: inline-block;
          background-color: #4f46e5;
          color: #ffffff;
          text-decoration: none;
          padding: 14px 28px;
          border-radius: 6px;
          font-weight: bold;
          margin-top: 16px;
        }
        .footer {
          text-align: center;
          padding: 24px;
          font-size: 14px;
          color: #64748b;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${title}</h1>
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Vibely. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const getOtpEmailTemplate = (otp) => {
  const title = 'Your Verification Code';
  const content = `
    <p>Hello,</p>
    <p>Thank you for registering with Vibely. Please use the verification code below to complete your registration:</p>
    <div align="center">
      <div class="otp-code">${otp}</div>
    </div>
    <p>This code will expire in 10 minutes. If you did not request this code, please ignore this email.</p>
    <p>Best,<br>The Vibely Team</p>
  `;
  return getEmailTemplate(title, content);
};

export const getResetPasswordEmailTemplate = (resetLink) => {
  const title = 'Reset Your Password';
  const content = `
    <p>Hello,</p>
    <p>We received a request to reset your password for your Vibely account. You can reset your password by clicking the button below:</p>
    <div align="center">
      <a href="${resetLink}" class="button">Reset Password</a>
    </div>
    <p>This link will expire in 1 hour. If you did not request a password reset, you can safely ignore this email.</p>
    <p>Best,<br>The Vibely Team</p>
  `;
  return getEmailTemplate(title, content);
};