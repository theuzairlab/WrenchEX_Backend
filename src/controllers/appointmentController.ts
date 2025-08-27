import { Request, Response } from 'express';
import { AppointmentService } from '../services/appointmentService';
import { ApiResponse, UserRole, AppointmentStatus } from '../types';
import { validateRequest, appointmentValidation, updateAppointmentStatusValidation } from '../utils/validators';
import prisma from '../config/database';

export class AppointmentController {
  /**
   * Create a new appointment
   */
  static async createAppointment(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const validatedData = validateRequest(appointmentValidation, req.body);

      const appointment = await AppointmentService.createAppointment(userId, validatedData);

      const response: ApiResponse<any> = {
        success: true,
        data: appointment
      };

      res.status(201).json(response);
    } catch (error: any) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          message: error.message || 'Failed to create appointment'
        }
      };

      res.status(400).json(response);
    }
  }

  /**
   * Get appointment by ID
   */
  static async getAppointmentById(req: Request, res: Response): Promise<void> {
    try {
      const { appointmentId } = req.params;
      const userId = req.user!.id;
      const userRole = req.user!.role;

      const appointment = await AppointmentService.getAppointmentById(appointmentId);

      // Check if user has permission to view this appointment
      const hasPermission = 
        appointment.buyerId === userId || 
        appointment.sellerId === userId || 
        userRole === UserRole.ADMIN;

      if (!hasPermission) {
        const response: ApiResponse<null> = {
          success: false,
          error: {
            message: 'You are not authorized to view this appointment'
          }
        };
        res.status(403).json(response);
        return;
      }

      const response: ApiResponse<any> = {
        success: true,
        data: appointment
      };

      res.status(200).json(response);
    } catch (error: any) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          message: error.message || 'Failed to get appointment'
        }
      };

      res.status(error.message === 'Appointment not found' ? 404 : 500).json(response);
    }
  }

  /**
   * Get appointments with filters
   */
  static async getAppointments(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const userRole = req.user!.role;
      
      // Extract query parameters
      const {
        status,
        sellerId,
        buyerId,
        serviceId,
        startDate,
        endDate,
        page = 1,
        limit = 10
      } = req.query;

      // Build filters based on user role
      let filters: any = {
        page: Number(page),
        limit: Number(limit)
      };

      if (status) filters.status = status as AppointmentStatus;
      if (serviceId) filters.serviceId = serviceId as string;
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);

      // Role-based filtering
      if (userRole === UserRole.ADMIN) {
        // Admin can see all appointments and filter by seller/buyer
        if (sellerId) filters.sellerId = sellerId as string;
        if (buyerId) filters.buyerId = buyerId as string;
      } else if (userRole === UserRole.SELLER) {
        // Sellers see only their appointments - need to convert userId to sellerId
        const seller = await prisma.seller.findUnique({
          where: { userId }
        });
        
        if (seller) {
          filters.sellerId = seller.id;
        } else {
          // No seller profile, return empty results
          const response: ApiResponse<any> = {
            success: true,
            data: {
              appointments: [],
              pagination: { page: 1, limit: 10, total: 0, pages: 0 }
            }
          };
          res.status(200).json(response);
          return;
        }
      } else {
        // Buyers see only their appointments
        filters.buyerId = userId;
      }

      const result = await AppointmentService.getAppointments(filters);

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

  /**
   * Update appointment status
   */
  static async updateAppointmentStatus(req: Request, res: Response): Promise<void> {
    try {
      const { appointmentId } = req.params;
      const userId = req.user!.id;
      const userRole = req.user!.role;
      const validatedData = validateRequest(updateAppointmentStatusValidation, req.body);

      // Get appointment to check permissions
      const existingAppointment = await AppointmentService.getAppointmentById(appointmentId);
      
      // Check if user has permission to update this appointment (need to check sellerId against user's seller record)
      let hasPermission = userRole === UserRole.ADMIN;
      
      if (userRole === UserRole.SELLER) {
        const seller = await prisma.seller.findUnique({
          where: { userId }
        });
        hasPermission = seller ? existingAppointment.sellerId === seller.id : false;
      }

      if (!hasPermission) {
        const response: ApiResponse<null> = {
          success: false,
          error: {
            message: 'You are not authorized to update this appointment'
          }
        };
        res.status(403).json(response);
        return;
      }

      const appointment = await AppointmentService.updateAppointmentStatus(
        appointmentId,
        validatedData.status,
        userId,
        validatedData.notes
      );

      const response: ApiResponse<any> = {
        success: true,
        data: appointment
      };

      res.status(200).json(response);
    } catch (error: any) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          message: error.message || 'Failed to update appointment status'
        }
      };

      res.status(400).json(response);
    }
  }

  /**
   * Cancel appointment
   */
  static async cancelAppointment(req: Request, res: Response): Promise<void> {
    try {
      const { appointmentId } = req.params;
      const userId = req.user!.id;
      const userRole = req.user!.role;
      const { reason } = req.body;

      // Get appointment to check permissions
      const existingAppointment = await AppointmentService.getAppointmentById(appointmentId);
      
      // Check if user has permission to cancel this appointment
      let hasPermission = 
        existingAppointment.buyerId === userId || 
        userRole === UserRole.ADMIN;
        
      if (userRole === UserRole.SELLER) {
        const seller = await prisma.seller.findUnique({
          where: { userId }
        });
        hasPermission = hasPermission || (seller ? existingAppointment.sellerId === seller.id : false);
      }

      if (!hasPermission) {
        const response: ApiResponse<null> = {
          success: false,
          error: {
            message: 'You are not authorized to cancel this appointment'
          }
        };
        res.status(403).json(response);
        return;
      }

      const appointment = await AppointmentService.cancelAppointment(appointmentId, userId, reason);

      const response: ApiResponse<any> = {
        success: true,
        data: appointment
      };

      res.status(200).json(response);
    } catch (error: any) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          message: error.message || 'Failed to cancel appointment'
        }
      };

      res.status(400).json(response);
    }
  }

  /**
   * Get available time slots for a service
   */
  static async getAvailableTimeSlots(req: Request, res: Response): Promise<void> {
    try {
      const { serviceId } = req.params;
      const { date, intervalMinutes = 30 } = req.query;

      if (!date) {
        const response: ApiResponse<null> = {
          success: false,
          error: {
            message: 'Date parameter is required'
          }
        };
        res.status(400).json(response);
        return;
      }

      const targetDate = new Date(date as string);
      const slots = await AppointmentService.getAvailableTimeSlots(
        serviceId,
        targetDate,
        Number(intervalMinutes)
      );

      const response: ApiResponse<any> = {
        success: true,
        data: { slots, date: targetDate }
      };

      res.status(200).json(response);
    } catch (error: any) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          message: error.message || 'Failed to get available time slots'
        }
      };

      res.status(500).json(response);
    }
  }

  /**
   * Get seller appointment analytics
   */
  static async getSellerAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { period = 'month' } = req.query;

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

      const analytics = await AppointmentService.getSellerAppointmentAnalytics(
        seller.id,
        period as 'today' | 'week' | 'month' | 'year'
      );

      const response: ApiResponse<any> = {
        success: true,
        data: analytics
      };

      res.status(200).json(response);
    } catch (error: any) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          message: error.message || 'Failed to get analytics'
        }
      };

      res.status(500).json(response);
    }
  }

  /**
   * Get upcoming appointments
   */
  static async getUpcomingAppointments(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const userRole = req.user!.role;
      const { limit = 5 } = req.query;

      // Determine the type and ID to use
      let targetUserId = userId;
      const userType = userRole === UserRole.SELLER ? 'seller' : 'buyer';
      
      // If seller, convert userId to sellerId
      if (userRole === UserRole.SELLER) {
        const seller = await prisma.seller.findUnique({
          where: { userId }
        });
        
        if (!seller) {
          const response: ApiResponse<any> = {
            success: true,
            data: []
          };
          res.status(200).json(response);
          return;
        }
        
        targetUserId = seller.id;
      }

      const appointments = await AppointmentService.getUpcomingAppointments(
        targetUserId,
        userType,
        Number(limit)
      );

      const response: ApiResponse<any> = {
        success: true,
        data: appointments
      };

      res.status(200).json(response);
    } catch (error: any) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          message: error.message || 'Failed to get upcoming appointments'
        }
      };

      res.status(500).json(response);
    }
  }
} 