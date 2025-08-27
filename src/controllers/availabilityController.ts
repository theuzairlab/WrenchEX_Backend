import { Request, Response } from 'express';
import { AvailabilityService } from '../services/availabilityService';
import { ApiResponse, UserRole } from '../types';
import { validateRequest, sellerAvailabilityValidation, sellerTimeOffValidation } from '../utils/validators';
import prisma from '../config/database';

export class AvailabilityController {
  /**
   * Set seller availability for a day
   */
  static async setDayAvailability(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const validatedData = validateRequest(sellerAvailabilityValidation, req.body);

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

      const availability = await AvailabilityService.setSellerAvailability(
        seller.id,
        validatedData.dayOfWeek,
        validatedData.startTime,
        validatedData.endTime,
        validatedData.isAvailable
      );

      const response: ApiResponse<any> = {
        success: true,
        data: availability
      };

      res.status(200).json(response);
    } catch (error: any) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          message: error.message || 'Failed to set availability'
        }
      };

      res.status(400).json(response);
    }
  }

  /**
   * Set weekly availability schedule
   */
  static async setWeeklyAvailability(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { weeklySchedule } = req.body;

      if (!Array.isArray(weeklySchedule)) {
        const response: ApiResponse<null> = {
          success: false,
          error: {
            message: 'Weekly schedule must be an array'
          }
        };
        res.status(400).json(response);
        return;
      }

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

      // Validate each day's schedule
      const validatedSchedule = weeklySchedule.map(day => 
        validateRequest(sellerAvailabilityValidation, day)
      );

      const availability = await AvailabilityService.setWeeklyAvailability(
        seller.id,
        validatedSchedule
      );

      const response: ApiResponse<any> = {
        success: true,
        data: availability
      };

      res.status(200).json(response);
    } catch (error: any) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          message: error.message || 'Failed to set weekly availability'
        }
      };

      res.status(400).json(response);
    }
  }

  /**
   * Get seller availability
   */
  static async getSellerAvailability(req: Request, res: Response): Promise<void> {
    try {
      const { sellerId } = req.params;
      const userId = req.user?.id;
      const userRole = req.user?.role;

      // Use current user's seller ID if no sellerId provided and user is a seller
      let targetSellerId: string | undefined = sellerId;
      
      if (!targetSellerId && userRole === UserRole.SELLER && userId) {
        const seller = await prisma.seller.findUnique({
          where: { userId }
        });
        if (seller) {
          targetSellerId = seller.id;
        }
      }

      if (!targetSellerId) {
        const response: ApiResponse<null> = {
          success: false,
          error: {
            message: 'Seller ID is required'
          }
        };
        res.status(400).json(response);
        return;
      }

      const availability = await AvailabilityService.getSellerAvailability(targetSellerId);

      const response: ApiResponse<any> = {
        success: true,
        data: availability
      };

      res.status(200).json(response);
    } catch (error: any) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          message: error.message || 'Failed to get availability'
        }
      };

      res.status(500).json(response);
    }
  }

  /**
   * Add time off
   */
  static async addTimeOff(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const validatedData = validateRequest(sellerTimeOffValidation, req.body);

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

      const timeOff = await AvailabilityService.addTimeOff(
        seller.id,
        validatedData.startDate,
        validatedData.endDate,
        validatedData.reason
      );

      const response: ApiResponse<any> = {
        success: true,
        data: timeOff
      };

      res.status(201).json(response);
    } catch (error: any) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          message: error.message || 'Failed to add time off'
        }
      };

      res.status(400).json(response);
    }
  }

  /**
   * Get seller time off
   */
  static async getTimeOff(req: Request, res: Response): Promise<void> {
    try {
      const { sellerId } = req.params;
      const userId = req.user?.id;
      const userRole = req.user?.role;

      // Use current user's seller ID if no sellerId provided and user is a seller
      let targetSellerId: string | undefined = sellerId;
      
      if (!targetSellerId && userRole === UserRole.SELLER && userId) {
        const seller = await prisma.seller.findUnique({
          where: { userId }
        });
        if (seller) {
          targetSellerId = seller.id;
        }
      }

      if (!targetSellerId) {
        const response: ApiResponse<null> = {
          success: false,
          error: {
            message: 'Seller ID is required'
          }
        };
        res.status(400).json(response);
        return;
      }

      // Only seller themselves or admin can see inactive time off
      let includeInactive = userRole === UserRole.ADMIN;
      
      if (userId && !includeInactive) {
        const currentUserSeller = await prisma.seller.findUnique({ where: { userId } });
        includeInactive = currentUserSeller?.id === targetSellerId;
      }

      const timeOff = await AvailabilityService.getSellerTimeOff(targetSellerId, includeInactive);

      const response: ApiResponse<any> = {
        success: true,
        data: timeOff
      };

      res.status(200).json(response);
    } catch (error: any) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          message: error.message || 'Failed to get time off'
        }
      };

      res.status(500).json(response);
    }
  }

  /**
   * Remove time off
   */
  static async removeTimeOff(req: Request, res: Response): Promise<void> {
    try {
      const { timeOffId } = req.params;
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

      await AvailabilityService.removeTimeOff(timeOffId, seller.id);

      const response: ApiResponse<null> = {
        success: true
      };

      res.status(200).json(response);
    } catch (error: any) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          message: error.message || 'Failed to remove time off'
        }
      };

      res.status(400).json(response);
    }
  }

  /**
   * Check seller availability for specific date/time
   */
  static async checkAvailability(req: Request, res: Response): Promise<void> {
    try {
      const { sellerId } = req.params;
      const { date, startTime, endTime } = req.query;

      if (!date || !startTime || !endTime) {
        const response: ApiResponse<null> = {
          success: false,
          error: {
            message: 'Date, startTime, and endTime are required'
          }
        };
        res.status(400).json(response);
        return;
      }

      const targetDate = new Date(date as string);
      const startDateTime = new Date(`${date} ${startTime}`);
      const endDateTime = new Date(`${date} ${endTime}`);

      const availability = await AvailabilityService.isSellerAvailable(
        sellerId,
        targetDate,
        startDateTime,
        endDateTime
      );

      const response: ApiResponse<any> = {
        success: true,
        data: availability
      };

      res.status(200).json(response);
    } catch (error: any) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          message: error.message || 'Failed to check availability'
        }
      };

      res.status(500).json(response);
    }
  }

  /**
   * Get seller calendar
   */
  static async getSellerCalendar(req: Request, res: Response): Promise<void> {
    try {
      const { sellerId } = req.params;
      const { startDate, endDate } = req.query;
      const userId = req.user?.id;
      const userRole = req.user?.role;

      // Use current user's seller ID if no sellerId provided and user is a seller
      let targetSellerId: string | undefined = sellerId;
      
      if (!targetSellerId && userRole === UserRole.SELLER && userId) {
        const seller = await prisma.seller.findUnique({
          where: { userId }
        });
        if (seller) {
          targetSellerId = seller.id;
        }
      }

      if (!targetSellerId) {
        const response: ApiResponse<null> = {
          success: false,
          error: {
            message: 'Seller ID is required'
          }
        };
        res.status(400).json(response);
        return;
      }

      if (!startDate || !endDate) {
        const response: ApiResponse<null> = {
          success: false,
          error: {
            message: 'Start date and end date are required'
          }
        };
        res.status(400).json(response);
        return;
      }

      const calendar = await AvailabilityService.getSellerCalendar(
        targetSellerId,
        new Date(startDate as string),
        new Date(endDate as string)
      );

      const response: ApiResponse<any> = {
        success: true,
        data: calendar
      };

      res.status(200).json(response);
    } catch (error: any) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          message: error.message || 'Failed to get calendar'
        }
      };

      res.status(500).json(response);
    }
  }

  /**
   * Get next available slot for a service
   */
  static async getNextAvailableSlot(req: Request, res: Response): Promise<void> {
    try {
      const { serviceId } = req.params;
      const { fromDate, daysAhead = 30 } = req.query;

      const startDate = fromDate ? new Date(fromDate as string) : new Date();

      const slot = await AvailabilityService.getNextAvailableSlot(
        serviceId,
        startDate,
        Number(daysAhead)
      );

      const response: ApiResponse<any> = {
        success: true,
        data: slot
      };

      res.status(200).json(response);
    } catch (error: any) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          message: error.message || 'Failed to get next available slot'
        }
      };

      res.status(500).json(response);
    }
  }
} 