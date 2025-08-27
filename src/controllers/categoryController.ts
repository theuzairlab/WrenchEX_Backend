import { Request, Response } from 'express';
import { CategoryService } from '../services/categoryService';
import { ApiResponse } from '../types';
import { validateRequest, categoryValidation } from '../utils/validators';

export class CategoryController {
  // GET /api/categories - Get all categories
  static async getAllCategories(req: Request, res: Response): Promise<void> {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const categories = await CategoryService.getAllCategories(includeInactive);

      const response: ApiResponse = {
        success: true,
        data: { categories }
      };

      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to get categories'
        }
      };
      res.status(500).json(response);
    }
  }

  // GET /api/categories/tree - Get category tree
  static async getCategoryTree(req: Request, res: Response): Promise<void> {
    try {
      const tree = await CategoryService.getCategoryTree();

      const response: ApiResponse = {
        success: true,
        data: { tree }
      };

      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to get category tree'
        }
      };
      res.status(500).json(response);
    }
  }

  // GET /api/categories/:id - Get category by ID
  static async getCategoryById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const category = await CategoryService.getCategoryById(id);

      const response: ApiResponse = {
        success: true,
        data: { category }
      };

      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Category not found'
        }
      };
      res.status(404).json(response);
    }
  }

  // GET /api/categories/:id/subcategories - Get subcategories
  static async getSubcategories(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await CategoryService.getSubcategories(id);

      const response: ApiResponse = {
        success: true,
        data: result
      };

      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to get subcategories'
        }
      };
      res.status(404).json(response);
    }
  }

  // POST /api/categories - Create category (Admin only)
  static async createCategory(req: Request, res: Response): Promise<void> {
    try {
      // Validate request data
      const validatedData = validateRequest(categoryValidation, req.body);

      const category = await CategoryService.createCategory(validatedData);

      const response: ApiResponse = {
        success: true,
        data: {
          category,
          message: 'Category created successfully'
        }
      };

      res.status(201).json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to create category'
        }
      };
      res.status(400).json(response);
    }
  }

  // PUT /api/categories/:id - Update category (Admin only)
  static async updateCategory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Validate request data (all fields optional for update)
      const validatedData = validateRequest(
        categoryValidation.fork([], schema => schema.optional()),
        req.body
      );

      // Check if there's actually data to update
      if (Object.keys(validatedData).length === 0) {
        const response: ApiResponse = {
          success: false,
          error: { message: 'No valid fields provided for update' }
        };
        res.status(400).json(response);
        return;
      }

      const category = await CategoryService.updateCategory(id, validatedData);

      const response: ApiResponse = {
        success: true,
        data: {
          category,
          message: 'Category updated successfully'
        }
      };

      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to update category'
        }
      };
      res.status(400).json(response);
    }
  }

  // DELETE /api/categories/:id - Delete category (Admin only)
  static async deleteCategory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await CategoryService.deleteCategory(id);

      const response: ApiResponse = {
        success: true,
        data: result
      };

      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to delete category'
        }
      };
      res.status(400).json(response);
    }
  }
} 