import { Request, Response } from 'express';
import { ServiceService } from '../services/serviceService';
import { ApiResponse, UserRole } from '../types';
import { validateRequest, createServiceValidation, serviceSearchValidation } from '../utils/validators';
import prisma from '../config/database';

export class ServiceController {
  /**
   * Create a new service
   */
  static async createService(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const validatedData = validateRequest(createServiceValidation, req.body);

      // Find the seller record for this user
      const seller = await prisma.seller.findUnique({
        where: { userId }
      });

      if (!seller) {
        const response: ApiResponse<null> = {
          success: false,
          error: {
            message: 'Seller profile not found. Please register as a seller first.'
          }
        };
        res.status(404).json(response);
        return;
      }

      const service = await ServiceService.createService(seller.id, validatedData);

      const response: ApiResponse<any> = {
        success: true,
        data: service
      };

      res.status(201).json(response);
    } catch (error: any) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          message: error.message || 'Failed to create service'
        }
      };

      res.status(400).json(response);
    }
  }

  /**
   * Get service by ID
   */
  static async getServiceById(req: Request, res: Response): Promise<void> {
    try {
      const { serviceId } = req.params;

      const service = await ServiceService.getServiceById(serviceId);

      const response: ApiResponse<any> = {
        success: true,
        data: service
      };

      res.status(200).json(response);
    } catch (error: any) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          message: error.message || 'Failed to get service'
        }
      };

      res.status(error.message === 'Service not found' ? 404 : 500).json(response);
    }
  }

  /**
   * Get services with filters
   */
  static async getServices(req: Request, res: Response): Promise<void> {
    try {
      const validatedFilters = validateRequest(serviceSearchValidation, req.query);

      const result = await ServiceService.getServices(validatedFilters);

      const response: ApiResponse<any> = {
        success: true,
        data: result
      };

      res.status(200).json(response);
    } catch (error: any) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          message: error.message || 'Failed to get services'
        }
      };

      res.status(500).json(response);
    }
  }

  /**
   * Get featured services
   */
  static async getFeaturedServices(req: Request, res: Response): Promise<void> {
    try {
      const { limit = 8 } = req.query;

      const services = await ServiceService.getFeaturedServices(Number(limit));

      const response: ApiResponse<any> = {
        success: true,
        data: services
      };

      res.status(200).json(response);
    } catch (error: any) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          message: error.message || 'Failed to get featured services'
        }
      };

      res.status(500).json(response);
    }
  }

  /**
   * Get mobile services (mobile mechanics)
   */
  static async getMobileServices(req: Request, res: Response): Promise<void> {
    try {
      const validatedFilters = validateRequest(serviceSearchValidation, req.query);

      const result = await ServiceService.getMobileServices(validatedFilters);

      const response: ApiResponse<any> = {
        success: true,
        data: result
      };

      res.status(200).json(response);
    } catch (error: any) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          message: error.message || 'Failed to get mobile services'
        }
      };

      res.status(500).json(response);
    }
  }

  /**
   * Get services by seller
   */
  static async getServicesBySeller(req: Request, res: Response): Promise<void> {
    try {
      const { sellerId } = req.params;
      const userId = req.user?.id;
      const userRole = req.user?.role;

      // For seller dashboard, always include inactive services if it's the current user
      // or if it's an admin viewing any seller
      const includeInactive = (userId === sellerId) || (userRole === UserRole.ADMIN);

      const services = await ServiceService.getServicesBySeller(sellerId, includeInactive);

      const response: ApiResponse<any> = {
        success: true,
        data: services
      };

      res.status(200).json(response);
    } catch (error: any) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          message: error.message || 'Failed to get seller services'
        }
      };

      res.status(500).json(response);
    }
  }

  /**
   * Update service
   */
  static async updateService(req: Request, res: Response): Promise<void> {
    try {
      const { serviceId } = req.params;
      const userId = req.user!.id;
      const validatedData = validateRequest(createServiceValidation, req.body);

      // Find the seller record for this user
      const seller = await prisma.seller.findUnique({
        where: { userId }
      });

      if (!seller) {
        const response: ApiResponse<null> = {
          success: false,
          error: {
            message: 'Seller profile not found. Please register as a seller first.'
          }
        };
        res.status(404).json(response);
        return;
      }

      const service = await ServiceService.updateService(serviceId, seller.id, validatedData);

      const response: ApiResponse<any> = {
        success: true,
        data: service
      };

      res.status(200).json(response);
    } catch (error: any) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          message: error.message || 'Failed to update service'
        }
      };

      res.status(400).json(response);
    }
  }

  /**
   * Toggle service status (activate/deactivate)
   */
  static async toggleServiceStatus(req: Request, res: Response): Promise<void> {
    try {
      const { serviceId } = req.params;
      const userId = req.user!.id;

      // Find the seller record for this user
      const seller = await prisma.seller.findUnique({
        where: { userId }
      });

      if (!seller) {
        const response: ApiResponse<null> = {
          success: false,
          error: {
            message: 'Seller profile not found. Please register as a seller first.'
          }
        };
        res.status(404).json(response);
        return;
      }

      const result = await ServiceService.toggleServiceStatus(serviceId, seller.id);

      const response: ApiResponse<any> = {
        success: true,
        data: result
      };

      res.status(200).json(response);
    } catch (error: any) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          message: error.message || 'Failed to toggle service status'
        }
      };

      res.status(400).json(response);
    }
  }

  /**
   * Delete service
   */
  static async deleteService(req: Request, res: Response): Promise<void> {
    try {
      const { serviceId } = req.params;
      const userId = req.user!.id;

      // Find the seller record for this user
      const seller = await prisma.seller.findUnique({
        where: { userId }
      });

      if (!seller) {
        const response: ApiResponse<null> = {
          success: false,
          error: {
            message: 'Seller profile not found. Please register as a seller first.'
          }
        };
        res.status(404).json(response);
        return;
      }

      await ServiceService.deleteService(serviceId, seller.id);

      const response: ApiResponse<null> = {
        success: true
      };

      res.status(200).json(response);
    } catch (error: any) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          message: error.message || 'Failed to delete service'
        }
      };

      res.status(400).json(response);
    }
  }

  /**
   * Get service categories
   */
  static async getServiceCategories(req: Request, res: Response): Promise<void> {
    try {
      const categories = await ServiceService.getServiceCategories();

      const response: ApiResponse<any> = {
        success: true,
        data: categories
      };

      res.status(200).json(response);
    } catch (error: any) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          message: error.message || 'Failed to get service categories'
        }
      };

      res.status(500).json(response);
    }
  }

  /**
   * Search services near location (for mobile services)
   */
  static async searchServicesNearLocation(req: Request, res: Response): Promise<void> {
    try {
      const { latitude, longitude, radiusKm = 10 } = req.query;

      if (!latitude || !longitude) {
        const response: ApiResponse<null> = {
          success: false,
          error: {
            message: 'Latitude and longitude are required'
          }
        };
        res.status(400).json(response);
        return;
      }

      const validatedFilters = validateRequest(serviceSearchValidation, req.query);

      const result = await ServiceService.searchServicesNearLocation(
        Number(latitude),
        Number(longitude),
        Number(radiusKm),
        validatedFilters
      );

      const response: ApiResponse<any> = {
        success: true,
        data: result
      };

      res.status(200).json(response);
    } catch (error: any) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          message: error.message || 'Failed to search services near location'
        }
      };

      res.status(500).json(response);
    }
  }
} 