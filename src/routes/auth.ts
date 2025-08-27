import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

// POST /api/auth/register - User registration
router.post('/register', AuthController.register);

// POST /api/auth/login - User login
router.post('/login', AuthController.login);

// POST /api/auth/google - Google OAuth login
router.post('/google', AuthController.googleLogin);

// POST /api/auth/logout - User logout
router.post('/logout', AuthController.logout);

// GET /api/auth/me - Get current user profile (protected)
router.get('/me', authenticate, AuthController.getCurrentUser);

// POST /api/auth/verify-email - Email verification
router.post('/verify-email', AuthController.verifyEmail);

export default router; 