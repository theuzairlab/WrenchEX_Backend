import { Router } from 'express';
import { CategoryController } from '../controllers/categoryController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../types';

const router = Router();

// Public routes
// GET /api/categories - List all categories
router.get('/', CategoryController.getAllCategories);

// GET /api/categories/tree - Get category tree
router.get('/tree', CategoryController.getCategoryTree);

// GET /api/categories/:id - Get category details
router.get('/:id', CategoryController.getCategoryById);

// GET /api/categories/:id/subcategories - Get subcategories
router.get('/:id/subcategories', CategoryController.getSubcategories);

// Protected routes (Admin only for now)
router.use(authenticate);
router.use(authorize(UserRole.ADMIN));

// POST /api/categories - Create category (Admin only)
router.post('/', CategoryController.createCategory);

// PUT /api/categories/:id - Update category (Admin only)
router.put('/:id', CategoryController.updateCategory);

// DELETE /api/categories/:id - Delete category (Admin only)
router.delete('/:id', CategoryController.deleteCategory);

export default router; 