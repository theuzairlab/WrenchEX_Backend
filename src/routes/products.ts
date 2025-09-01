import { Router } from 'express';
import { ProductController } from '../controllers/productController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../types';

const router = Router();

// GET /api/products - List products (public)
router.get('/', ProductController.getProducts);

// GET /api/products/featured - Get featured products (public)
router.get('/featured', ProductController.getFeaturedProducts);

// GET /api/products/seller/:sellerId - Get products by seller (public, but sellers can see inactive ones)
router.get('/seller/:sellerId', ProductController.getProductsBySeller);

// GET /api/products/:id - Get product details (public)
router.get('/:id', ProductController.getProductById);

// Protected routes (require authentication)
router.use(authenticate);

// POST /api/products - Create product (Sellers only)
router.post('/', authorize(UserRole.SELLER), ProductController.createProduct);

// PUT /api/products/:id - Update product (Sellers only, own products)
router.put('/:id', authorize(UserRole.SELLER), ProductController.updateProduct);

// PATCH /api/products/:id/toggle-status - Toggle product status (Sellers only, own products)
router.patch('/:id/toggle-status', authorize(UserRole.SELLER), ProductController.toggleProductStatus);

// DELETE /api/products/:id - Delete product (Sellers only, own products)
router.delete('/:id', authorize(UserRole.SELLER), ProductController.deleteProduct);

export default router; 