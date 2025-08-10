import express from 'express';
import { register, registerInit, registerVerify, registerResend, login, getMe } from '../controllers/authController.js';
import authMiddleware from '../middleware/authmiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/register/init', registerInit);
router.post('/register/verify', registerVerify);
router.post('/register/resend', registerResend);
router.post('/login', login);
router.get('/me', authMiddleware, getMe);

export default router;
