import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All user routes require authentication
router.use(authenticate);

// GET /api/users/profile - Get user profile
router.get('/profile', UserController.getProfile);

// PUT /api/users/profile - Update user profile
router.put('/profile', UserController.updateProfile);

// DELETE /api/users/account - Delete user account
router.delete('/account', UserController.deleteAccount);

export default router; 