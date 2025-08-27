import { Request, Response } from 'express';
import { SellerService } from '../services/sellerService';
import { ApiResponse } from '../types';
import { validateRequest, sellerRegistrationValidation, sellerProfileUpdateValidation } from '../utils/validators';

export class SellerController {
  // POST /api/sellers/register
  static async registerSeller(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        const response: ApiResponse = {
          success: false,
          error: { message: 'User not authenticated' }
        };
        res.status(401).json(response);
        return;
      }

      // Validate request data
      const validatedData = validateRequest(sellerRegistrationValidation, req.body);

      // Register seller
      const seller = await SellerService.registerSeller(req.user.id, validatedData);

      const response: ApiResponse = {
        success: true,
        data: {
          seller,
          message: 'Seller registration successful. Awaiting admin approval.'
        }
      };

      res.status(201).json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Seller registration failed'
        }
      };
      res.status(400).json(response);
    }
  }

  // GET /api/sellers/profile
  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        const response: ApiResponse = {
          success: false,
          error: { message: 'User not authenticated' }
        };
        res.status(401).json(response);
        return;
      }

      const seller = await SellerService.getSellerByUserId(req.user.id);

      const response: ApiResponse = {
        success: true,
        data: {
          ...seller,
          phone: seller.user.phone,
          email: seller.user.email,
          firstName: seller.user.firstName,
          lastName: seller.user.lastName,
          productCount: seller._count.products,
          serviceCount: seller._count.services,
          orderCount: seller._count.appointments
        }
      };

      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to get seller profile'
        }
      };
      res.status(404).json(response);
    }
  }

  // PUT /api/sellers/profile
  static async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        const response: ApiResponse = {
          success: false,
          error: { message: 'User not authenticated' }
        };
        res.status(401).json(response);
        return;
      }

      // Validate request data using the update validation schema
      const validatedData = validateRequest(sellerProfileUpdateValidation, req.body);

      // Check if there's actually data to update
      if (Object.keys(validatedData).length === 0) {
        const response: ApiResponse = {
          success: false,
          error: { message: 'No valid fields provided for update' }
        };
        res.status(400).json(response);
        return;
      }

      const updatedSeller = await SellerService.updateSellerProfile(req.user.id, validatedData);

      if (!updatedSeller) {
        const response: ApiResponse = {
          success: false,
          error: { message: 'Failed to update seller profile' }
        };
        res.status(500).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: {
          ...updatedSeller,
          phone: updatedSeller.user.phone,
          email: updatedSeller.user.email,
          firstName: updatedSeller.user.firstName,
          lastName: updatedSeller.user.lastName,
          productCount: updatedSeller._count.products,
          serviceCount: updatedSeller._count.services,
          orderCount: updatedSeller._count.appointments
        }
      };

      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to update seller profile'
        }
      };
      res.status(400).json(response);
    }
  }

  // GET /api/sellers/dashboard
  static async getDashboard(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        const response: ApiResponse = {
          success: false,
          error: { message: 'User not authenticated' }
        };
        res.status(401).json(response);
        return;
      }

      const dashboard = await SellerService.getSellerDashboard(req.user.id);

      const response: ApiResponse = {
        success: true,
        data: dashboard
      };

      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to get seller dashboard'
        }
      };
      res.status(500).json(response);
    }
  }

  // GET /api/sellers/earnings
  static async getEarnings(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        const response: ApiResponse = {
          success: false,
          error: { message: 'User not authenticated' }
        };
        res.status(401).json(response);
        return;
      }

      const earnings = await SellerService.getSellerEarnings(req.user.id);

      const response: ApiResponse = {
        success: true,
        data: earnings
      };

      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to get seller earnings'
        }
      };
      res.status(403).json(response);
    }
  }
} 