import { Request, Response } from 'express';
import { ProductService } from '../services/productService';
import { ApiResponse } from '../types';
import { validateRequest, productValidation, paginationValidation } from '../utils/validators';

export class ProductController {
  // GET /api/products - List products with filters
  static async getProducts(req: Request, res: Response): Promise<void> {
    try {
      // Validate pagination and filters
      const validatedQuery = validateRequest(paginationValidation, req.query);
      
      const filters = {
        ...validatedQuery,
        category: req.query.category as string,
        seller: req.query.seller as string,
        city: req.query.city as string,
        area: req.query.area as string,
        minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
        maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
        search: req.query.search as string
      };

      const result = await ProductService.getProducts(filters);

      const response: ApiResponse = {
        success: true,
        data: result
      };

      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to get products'
        }
      };
      res.status(500).json(response);
    }
  }

  // GET /api/products/featured - Get featured products
  static async getFeaturedProducts(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 8;
      const products = await ProductService.getFeaturedProducts(limit);

      const response: ApiResponse = {
        success: true,
        data: { products }
      };

      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to get featured products'
        }
      };
      res.status(500).json(response);
    }
  }

  // GET /api/products/:id - Get product by ID
  static async getProductById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const product = await ProductService.getProductById(id);

      const response: ApiResponse = {
        success: true,
        data: { product }
      };

      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Product not found'
        }
      };
      res.status(404).json(response);
    }
  }

  // GET /api/products/my - Get seller's own products
  static async getMyProducts(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        const response: ApiResponse = {
          success: false,
          error: { message: 'User not authenticated' }
        };
        res.status(401).json(response);
        return;
      }

      // Get seller information
      const seller = await ProductService.getSellerByUserId(req.user.id);
      if (!seller) {
        const response: ApiResponse = {
          success: false,
          error: { message: 'Seller profile not found' }
        };
        res.status(404).json(response);
        return;
      }

      // Validate pagination and filters
      const validatedQuery = validateRequest(paginationValidation, req.query);
      
      const filters = {
        ...validatedQuery,
        sellerId: seller.id, // Filter by current seller
        category: req.query.category as string,
        search: req.query.search as string,
        status: req.query.status as string,
        includeInactive: true // Sellers can see their own inactive products
      };

      const result = await ProductService.getProducts(filters);

      const response: ApiResponse = {
        success: true,
        data: result
      };

      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to get your products'
        }
      };
      res.status(500).json(response);
    }
  }

  // POST /api/products - Create new product (Seller only)
  static async createProduct(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        const response: ApiResponse = {
          success: false,
          error: { message: 'User not authenticated' }
        };
        res.status(401).json(response);
        return;
      }

      // Get seller ID from user
      const seller = await ProductService.getSellerByUserId(req.user.id);
      if (!seller) {
        const response: ApiResponse = {
          success: false,
          error: { message: 'Seller profile not found' }
        };
        res.status(404).json(response);
        return;
      }

      // Validate request data
      const validatedData = validateRequest(productValidation, req.body);

      // Create product
      const product = await ProductService.createProduct(seller.id, validatedData);

      const response: ApiResponse = {
        success: true,
        data: {
          product,
          message: 'Product created successfully'
        }
      };

      res.status(201).json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to create product'
        }
      };
      res.status(400).json(response);
    }
  }

  // PUT /api/products/:id - Update product (Seller only, own products)
  static async updateProduct(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        const response: ApiResponse = {
          success: false,
          error: { message: 'User not authenticated' }
        };
        res.status(401).json(response);
        return;
      }

      const { id } = req.params;

      // Get seller ID from user
      const seller = await ProductService.getSellerByUserId(req.user.id);
      if (!seller) {
        const response: ApiResponse = {
          success: false,
          error: { message: 'Seller profile not found' }
        };
        res.status(404).json(response);
        return;
      }

      // Validate request data (all fields optional for update)
      const validatedData = validateRequest(
        productValidation.fork([], schema => schema.optional()), 
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

      const product = await ProductService.updateProduct(id, seller.id, validatedData);

      const response: ApiResponse = {
        success: true,
        data: {
          product,
          message: 'Product updated successfully'
        }
      };

      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to update product'
        }
      };
      res.status(400).json(response);
    }
  }

  // DELETE /api/products/:id - Delete product (Seller only, own products)
  static async deleteProduct(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        const response: ApiResponse = {
          success: false,
          error: { message: 'User not authenticated' }
        };
        res.status(401).json(response);
        return;
      }

      const { id } = req.params;

      // Get seller ID from user
      const seller = await ProductService.getSellerByUserId(req.user.id);
      if (!seller) {
        const response: ApiResponse = {
          success: false,
          error: { message: 'Seller profile not found' }
        };
        res.status(404).json(response);
        return;
      }

      const result = await ProductService.deleteProduct(id, seller.id);

      const response: ApiResponse = {
        success: true,
        data: result
      };

      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to delete product'
        }
      };
      res.status(400).json(response);
    }
  }

  // GET /api/products/seller/:sellerId - Get products by seller
  static async getProductsBySeller(req: Request, res: Response): Promise<void> {
    try {
      const { sellerId } = req.params;
      const includeInactive = req.query.includeInactive === 'true';

      // Only allow sellers to see their own inactive products
      if (includeInactive && req.user) {
        const seller = await ProductService.getSellerByUserId(req.user.id);
        if (!seller || seller.id !== sellerId) {
          const response: ApiResponse = {
            success: false,
            error: { message: 'Not authorized to view inactive products' }
          };
          res.status(403).json(response);
          return;
        }
      }

      const products = await ProductService.getProductsBySeller(sellerId, includeInactive);

      const response: ApiResponse = {
        success: true,
        data: { products }
      };

      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to get seller products'
        }
      };
      res.status(500).json(response);
    }
  }
}

// No need for module declaration since method is already in ProductService 