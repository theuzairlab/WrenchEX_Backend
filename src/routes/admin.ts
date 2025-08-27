import { Router } from 'express';
import { AdminController } from '../controllers/adminController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../types';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize(UserRole.ADMIN));

// Platform Statistics
router.get('/stats', AdminController.getPlatformStats);

// User Management
router.get('/users', AdminController.getUsers);

// Seller Management
router.get('/sellers', AdminController.getSellers);
router.put('/sellers/:sellerId/approval', AdminController.updateSellerApproval);

// Chat Moderation
router.get('/chats', AdminController.getChatReports);
router.delete('/chats/:chatId', AdminController.deleteChat);

// Appointment Management
router.get('/appointments', AdminController.getAppointments);

export default router;
