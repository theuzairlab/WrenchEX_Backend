import { Router } from 'express';
import { SellerController } from '../controllers/sellerController';
import { ProductController } from '../controllers/productController';
import { ServiceController } from '../controllers/serviceController';
import { ServiceService } from '../services/serviceService';
import { authenticate, authorize, checkSellerApproval } from '../middleware/auth';
import { UserRole } from '../types';
import prisma from '../config/database';

const router = Router();

// All seller routes require authentication
router.use(authenticate);

// POST /api/sellers/register - Seller registration (requires SELLER role)
router.post('/register', authorize(UserRole.SELLER), SellerController.registerSeller);

// GET /api/sellers/profile - Get seller profile (requires SELLER role)
router.get('/profile', authorize(UserRole.SELLER), SellerController.getProfile);

// PUT /api/sellers/profile - Update seller profile (requires SELLER role)
router.put('/profile', authorize(UserRole.SELLER), SellerController.updateProfile);

// GET /api/sellers/dashboard - Seller dashboard data (requires approved seller)
router.get('/dashboard', authorize(UserRole.SELLER), checkSellerApproval, SellerController.getDashboard);

// GET /api/sellers/earnings - Seller earnings (requires approved seller)
router.get('/earnings', authorize(UserRole.SELLER), checkSellerApproval, SellerController.getEarnings);

// GET /api/sellers/products - Get seller's own products (requires SELLER role)
router.get('/products', authorize(UserRole.SELLER), ProductController.getMyProducts);

// Services route for sellers
router.get('/services', authorize(UserRole.SELLER), async (req, res) => {
  try {
    const userId = req.user!.id;
    
    // Find the seller record for this user
    const seller = await prisma.seller.findUnique({
      where: { userId }
    });
    
    if (!seller) {
      return res.status(404).json({
        success: false,
        error: { message: 'Seller profile not found' }
      });
    }
    
    // Always use the getServicesBySeller method with includeInactive: true
    // This ensures sellers can see all their services (active and inactive)
    const services = await ServiceService.getServicesBySeller(seller.id, true);
    
    return res.status(200).json({
      success: true,
      data: services
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
});

export default router; 