import { Router } from 'express';
import { ProductChatController } from '../controllers/productChatController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../types';

const router = Router();

// All chat routes require authentication
router.use(authenticate);

// Start chat with seller about a product
router.post('/product/:productId/start', ProductChatController.startChat);

// Get all conversations for current user
router.get('/conversations', ProductChatController.getUserChats);

// Get unread message count
router.get('/unread-count', ProductChatController.getUnreadCount);

// Send message in a chat
router.post('/:chatId/send', ProductChatController.sendMessage);

// Get chat by ID with messages
router.get('/:chatId', ProductChatController.getChatById);

// Mark chat as read
router.put('/:chatId/read', ProductChatController.markAsRead);

// Seller-specific routes
router.get('/seller/settings', authorize(UserRole.SELLER), ProductChatController.getSellerSettings);
router.put('/seller/settings', authorize(UserRole.SELLER), ProductChatController.updateSellerSettings);
router.post('/seller/online-status', authorize(UserRole.SELLER), ProductChatController.setOnlineStatus);

export default router;
