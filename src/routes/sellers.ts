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
    
    // Check if search or filters are provided
    const hasFilters = req.query.search || req.query.categoryId || req.query.isMobileService;
    
    if (hasFilters) {
      // Use the general getServices method with seller filtering
      const filters = {
        sellerId: seller.id,
        search: req.query.search as string,
        categoryId: req.query.categoryId as string,
        isMobileService: req.query.isMobileService === 'true' ? true : req.query.isMobileService === 'false' ? false : undefined,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        includeInactive: true // Sellers can see their own inactive services
      };
      
      const services = await ServiceService.getServices(filters);
      
      return res.status(200).json({
        success: true,
        data: services
      });
    } else {
      // Use the simple getServicesBySeller method for basic listing
      req.params.sellerId = seller.id;
      return ServiceController.getServicesBySeller(req, res);
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
});

export default router; 