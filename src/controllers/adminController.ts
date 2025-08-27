import { Request, Response } from 'express';
import { AdminService } from '../services/adminService';
import { ApiResponse, UserRole, AppointmentStatus } from '../types';

export class AdminController {
  /**
   * Get platform statistics
   * GET /api/admin/stats
   */
  static async getPlatformStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await AdminService.getPlatformStats();

      const response: ApiResponse<any> = {
        success: true,
        data: { stats }
      };

      res.status(200).json(response);
    } catch (error: any) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          message: error.message || 'Failed to get platform stats'
        }
      };

      res.status(500).json(response);
    }
  }

  /**
   * Get users with filters
   * GET /api/admin/users
   */
  static async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const { role, search, page, limit } = req.query;

      const filters = {
        role: role as UserRole,
        search: search as string,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined
      };

      const result = await AdminService.getUsers(filters);

      const response: ApiResponse<any> = {
        success: true,
        data: result
      };

      res.status(200).json(response);
    } catch (error: any) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          message: error.message || 'Failed to get users'
        }
      };

      res.status(500).json(response);
    }
  }

  /**
   * Get sellers for approval/management
   * GET /api/admin/sellers
   */
  static async getSellers(req: Request, res: Response): Promise<void> {
    try {
      const { isApproved, search, page, limit } = req.query;

      const filters = {
        isApproved: isApproved === 'true' ? true : isApproved === 'false' ? false : undefined,
        search: search as string,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined
      };

      const result = await AdminService.getSellers(filters);

      const response: ApiResponse<any> = {
        success: true,
        data: result
      };

      res.status(200).json(response);
    } catch (error: any) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          message: error.message || 'Failed to get sellers'
        }
      };

      res.status(500).json(response);
    }
  }

  /**
   * Approve or reject seller
   * PUT /api/admin/sellers/:sellerId/approval
   */
  static async updateSellerApproval(req: Request, res: Response): Promise<void> {
    try {
      const { sellerId } = req.params;
      const { isApproved } = req.body;

      if (typeof isApproved !== 'boolean') {
        const response: ApiResponse<null> = {
          success: false,
          error: { message: 'isApproved must be a boolean value' }
        };
        res.status(400).json(response);
        return;
      }

      const seller = await AdminService.updateSellerApproval(sellerId, isApproved);

      const response: ApiResponse<any> = {
        success: true,
        data: { seller }
      };

      res.status(200).json(response);
    } catch (error: any) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          message: error.message || 'Failed to update seller approval'
        }
      };

      const statusCode = error.message === 'Seller not found' ? 404 : 400;
      res.status(statusCode).json(response);
    }
  }

  /**
   * Get chat reports for moderation
   * GET /api/admin/chats
   */
  static async getChatReports(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate, page, limit } = req.query;

      const filters = {
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined
      };

      const result = await AdminService.getChatReports(filters);

      const response: ApiResponse<any> = {
        success: true,
        data: result
      };

      res.status(200).json(response);
    } catch (error: any) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          message: error.message || 'Failed to get chat reports'
        }
      };

      res.status(500).json(response);
    }
  }

  /**
   * Delete chat (moderation)
   * DELETE /api/admin/chats/:chatId
   */
  static async deleteChat(req: Request, res: Response): Promise<void> {
    try {
      const { chatId } = req.params;

      await AdminService.deleteChat(chatId);

      const response: ApiResponse<null> = {
        success: true
      };

      res.status(200).json(response);
    } catch (error: any) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          message: error.message || 'Failed to delete chat'
        }
      };

      const statusCode = error.message === 'Chat not found' ? 404 : 400;
      res.status(statusCode).json(response);
    }
  }

  /**
   * Get appointments for admin review
   * GET /api/admin/appointments
   */
  static async getAppointments(req: Request, res: Response): Promise<void> {
    try {
      const { status, startDate, endDate, page, limit } = req.query;

      const filters = {
        status: status as AppointmentStatus,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined
      };

      const result = await AdminService.getAppointments(filters);

      const response: ApiResponse<any> = {
        success: true,
        data: result
      };

      res.status(200).json(response);
    } catch (error: any) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          message: error.message || 'Failed to get appointments'
        }
      };

      res.status(500).json(response);
    }
  }
}
