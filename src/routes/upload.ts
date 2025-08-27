import { Router } from 'express';
import { UploadController } from '../controllers/uploadController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../types';

const router = Router();

// All upload routes require authentication
router.use(authenticate);

// POST /api/upload/image - Upload single image
router.post('/image', UploadController.uploadImage);

// POST /api/upload/images - Upload multiple images
router.post('/images', UploadController.uploadMultipleImages);

// GET /api/upload/auth - Get ImageKit auth parameters for client-side upload
router.get('/auth', UploadController.getAuthParameters);

// GET /api/upload/:fileId - Get image details
router.get('/:fileId', UploadController.getImageDetails);

// DELETE /api/upload/:fileId - Delete image
router.delete('/:fileId', UploadController.deleteImage);

// Admin only routes
// DELETE /api/upload/batch - Delete multiple images (Admin only)
router.delete('/batch', authorize(UserRole.ADMIN), UploadController.deleteMultipleImages);

export default router; 