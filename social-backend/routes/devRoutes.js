import express from 'express';
import { sendMail } from '../utils/mailer.js';

const router = express.Router();

// GET /api/dev/send-test?to=email@example.com
router.get('/send-test', async (req, res, next) => {
  try {
    const to = (req.query.to || process.env.SMTP_USER || '').toString();
    if (!to) return res.status(400).json({ message: 'Provide ?to=email or set SMTP_USER' });
    const info = await sendMail({
      to,
      subject: 'SMTP Test from SocialMediaApp',
      text: 'This is a test email from your backend.',
      html: '<p>This is a <b>test</b> email from your backend.</p>',
    });
    res.json({ ok: true, messageId: info.messageId });
  } catch (err) {
    next(err);
  }
});

export default router;
