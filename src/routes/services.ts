import { Router } from 'express';
import { ServiceController } from '../controllers/serviceController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../types';

const router = Router();

// Public routes (no authentication required)
router.get('/', ServiceController.getServices);
router.get('/featured', ServiceController.getFeaturedServices);
router.get('/mobile', ServiceController.getMobileServices);
router.get('/categories', ServiceController.getServiceCategories);
router.get('/near', ServiceController.searchServicesNearLocation);
router.get('/:serviceId', ServiceController.getServiceById);
router.get('/seller/:sellerId', ServiceController.getServicesBySeller);

// Protected routes (authentication required)
router.use(authenticate);

// Create service (sellers only)
router.post('/', authorize(UserRole.SELLER), ServiceController.createService);

// Update service (sellers only - can only update their own)
router.put('/:serviceId', authorize(UserRole.SELLER), ServiceController.updateService);

// Toggle service status (sellers only - can only toggle their own)
router.patch('/:serviceId/toggle-status', authorize(UserRole.SELLER), ServiceController.toggleServiceStatus);

// Delete service (sellers only - can only delete their own)
router.delete('/:serviceId', authorize(UserRole.SELLER), ServiceController.deleteService);

export default router; 