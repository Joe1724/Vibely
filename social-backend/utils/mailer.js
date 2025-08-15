import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { getOtpEmailTemplate, getResetPasswordEmailTemplate } from './emailTemplates.js';

dotenv.config();

const isProduction = String(process.env.NODE_ENV || '').toLowerCase() === 'production';

let transporter = null;
if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 465),
    secure: String(process.env.SMTP_SECURE ?? 'true').toLowerCase() === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendMail({ to, subject, text, html }) {
  // Dev-friendly fallback when SMTP is not configured
  if (!transporter) {
    if (!isProduction) {
      // Simulate sending email in development so flows don't crash
      // and display the message in server logs
      console.warn('[mailer] SMTP not configured; simulating email send');
      console.info('[mailer] To:', to);
      console.info('[mailer] Subject:', subject);
      console.info('[mailer] Text:', text);
      return { simulated: true };
    }
    throw Object.assign(new Error('SMTP is not configured (missing SMTP_USER/SMTP_PASS)'), { status: 500 });
  }

  await transporter.verify();
  const info = await transporter.sendMail({
    from: process.env.FROM_EMAIL || process.env.SMTP_USER,
    to,
    subject,
    text,
    html,
  });
  return info;
}

export async function sendOtpEmail(to, otp) {
  const subject = 'Your Vibely Verification Code';
  const html = getOtpEmailTemplate(otp);
  const text = `Your verification code is: ${otp}`;
  return sendMail({ to, subject, text, html });
}

export async function sendPasswordResetEmail(to, resetLink) {
  const subject = 'Reset Your Vibely Password';
  const html = getResetPasswordEmailTemplate(resetLink);
  const text = `Reset your password using this link: ${resetLink}`;
  return sendMail({ to, subject, text, html });
}
