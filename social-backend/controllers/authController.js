import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import OtpCode from '../models/OtpCode.js';
import { sendMail, sendOtpEmail, sendPasswordResetEmail } from '../utils/mailer.js';
import crypto from 'crypto';

export const register = async (req, res) => {
  try {
    const { username, email, password, confirmPassword, firstName, middleName = '', surname } = req.body;

    if (!firstName || !surname) {
      return res.status(400).json({ message: 'firstName and surname are required' });
    }

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'Email already registered' });

    const existingUsername = await User.findOne({ username });
    if (existingUsername) return res.status(400).json({ message: 'Username already taken' });

    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    user = new User({ username, email, firstName, middleName, surname, passwordHash, isVerified: true });
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        middleName: user.middleName,
        surname: user.surname,
        bio: user.bio,
        avatar: user.avatar,
        cover: user.cover,
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const registerInit = async (req, res) => {
  try {
    const { username, email, password, confirmPassword, firstName, middleName = '', surname } = req.body;
    if (!username || !email || !password || !firstName || !surname) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) return res.status(400).json({ message: 'Email already registered' });

    const existingUsername = await User.findOne({ username });
    if (existingUsername) return res.status(400).json({ message: 'Username already taken' });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Generate 6-digit OTP
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const codeHash = await bcrypt.hash(code, 10);

    const ttlMinutes = Number(process.env.OTP_TTL_MINUTES || 10);
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    const now = new Date();
    const existingOtp = await OtpCode.findOne({ email, purpose: 'register' });

    if (existingOtp) {
      const cooldownSec = Number(process.env.OTP_RESEND_COOLDOWN_SEC || 60);
      if (existingOtp.lastSentAt && now.getTime() - existingOtp.lastSentAt.getTime() < cooldownSec * 1000) {
        return res.status(429).json({ message: `Please wait before requesting another code` });
      }
      existingOtp.codeHash = codeHash;
      existingOtp.expiresAt = expiresAt;
      existingOtp.attempts = 0;
      existingOtp.lastSentAt = now;
      existingOtp.sendCount = (existingOtp.sendCount || 0) + 1;
      existingOtp.pending = { username, firstName, middleName, surname, passwordHash };
      await existingOtp.save();
    } else {
      await OtpCode.create({
        email,
        purpose: 'register',
        codeHash,
        expiresAt,
        attempts: 0,
        lastSentAt: now,
        sendCount: 1,
        pending: { username, firstName, middleName, surname, passwordHash },
      });
    }

    await sendOtpEmail(email, code);

    const isProd = String(process.env.NODE_ENV || '').toLowerCase() === 'production';
    const smtpConfigured = !!(process.env.SMTP_USER && process.env.SMTP_PASS);
    // In development without SMTP, return the code to the client for testing
    res.json({ ok: true, devCode: !isProd && !smtpConfigured ? code : undefined });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const registerVerify = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ message: 'Email and code are required' });

    const doc = await OtpCode.findOne({ email, purpose: 'register' });
    if (!doc) return res.status(400).json({ message: 'Invalid or expired code' });
    if (doc.expiresAt.getTime() < Date.now()) return res.status(400).json({ message: 'Invalid or expired code' });

    const maxAttempts = Number(process.env.OTP_MAX_ATTEMPTS || 5);
    if ((doc.attempts || 0) >= maxAttempts) return res.status(429).json({ message: 'Too many attempts, request a new code' });

    const match = await bcrypt.compare(code, doc.codeHash);
    if (!match) {
      doc.attempts = (doc.attempts || 0) + 1;
      await doc.save();
      return res.status(400).json({ message: 'Invalid or expired code' });
    }

    const { username, firstName, middleName, surname, passwordHash } = doc.pending || {};
    if (!username || !firstName || !surname || !passwordHash) {
      return res.status(400).json({ message: 'Registration data missing, please re-initiate' });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) return res.status(400).json({ message: 'Email already registered' });

    const existingUsername = await User.findOne({ username });
    if (existingUsername) return res.status(400).json({ message: 'Username already taken' });

    const user = new User({ username, email, firstName, middleName, surname, passwordHash, isVerified: true });
    await user.save();

    await OtpCode.deleteOne({ _id: doc._id });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        middleName: user.middleName,
        surname: user.surname,
        bio: user.bio,
        avatar: user.avatar,
        cover: user.cover,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const registerResend = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const doc = await OtpCode.findOne({ email, purpose: 'register' });
    if (!doc) return res.status(400).json({ message: 'No pending registration for this email' });

    const now = new Date();
    const cooldownSec = Number(process.env.OTP_RESEND_COOLDOWN_SEC || 60);
    if (doc.lastSentAt && now.getTime() - doc.lastSentAt.getTime() < cooldownSec * 1000) {
      return res.status(429).json({ message: 'Please wait before requesting another code' });
    }

    const maxResends = Number(process.env.OTP_MAX_RESENDS || 3);
    if ((doc.sendCount || 0) >= maxResends + 1) {
      return res.status(429).json({ message: 'Resend limit reached' });
    }

    const ttlMinutes = Number(process.env.OTP_TTL_MINUTES || 10);
    const newCode = String(Math.floor(100000 + Math.random() * 900000));

    doc.codeHash = await bcrypt.hash(newCode, 10);
    doc.expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
    doc.attempts = 0;
    doc.lastSentAt = now;
    doc.sendCount = (doc.sendCount || 0) + 1;

    await doc.save();

    await sendOtpEmail(email, newCode);

    const isProd = String(process.env.NODE_ENV || '').toLowerCase() === 'production';
    const smtpConfigured = !!(process.env.SMTP_USER && process.env.SMTP_PASS);
    res.json({ ok: true, devCode: !isProd && !smtpConfigured ? newCode : undefined });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        middleName: user.middleName,
        surname: user.surname,
        bio: user.bio,
        avatar: user.avatar,
        cover: user.cover,
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getMe = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Not authenticated' });

    const user = await User.findById(userId).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    // Important: To prevent user enumeration, always return a success-like
    // response, even if the user doesn't exist.
    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenHash = await bcrypt.hash(resetToken, 10);

      const ttlMinutes = 60; // 1 hour
      const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

      await OtpCode.create({
        email,
        purpose: 'reset_password',
        codeHash: resetTokenHash,
        expiresAt,
      });

      // IMPORTANT: The domain and protocol should come from env vars
      const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

      try {
        await sendPasswordResetEmail(email, resetLink);
      } catch (err) {
        // Log mailer errors but do not expose failure to the client
        console.error('Failed to send password reset email:', err);
      }
    }

    res.json({ message: 'If a user with that email exists, a password reset link has been sent.' });

  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, token, password, confirmPassword } = req.body;

    if (!email || !token || !password || !confirmPassword) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const doc = await OtpCode.findOne({ email, purpose: 'reset_password' });

    if (!doc || doc.expiresAt.getTime() < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    const match = await bcrypt.compare(token, doc.codeHash);
    if (!match) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    await User.updateOne({ email }, { $set: { passwordHash } });

    // Invalidate the token after use
    await OtpCode.deleteOne({ _id: doc._id });

    res.json({ message: 'Password has been reset successfully.' });

  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export default { register, registerInit, registerVerify, registerResend, login, getMe, forgotPassword, resetPassword };
