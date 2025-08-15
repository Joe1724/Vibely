import express from 'express';
import { register, registerInit, registerVerify, registerResend, login, getMe, forgotPassword, resetPassword } from '../controllers/authController.js';
import authMiddleware from '../middleware/authmiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/register/init', registerInit);
router.post('/register/verify', registerVerify);
router.post('/register/resend', registerResend);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', authMiddleware, getMe);

export default router;
