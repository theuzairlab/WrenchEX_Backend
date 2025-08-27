import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { ApiResponse } from '../types';
import Joi from 'joi';
import { validateRequest } from '../utils/validators';

// Profile update validation
const profileUpdateValidation = Joi.object({
  firstName: Joi.string()
    .min(2)
    .max(50)
    .pattern(/^[a-zA-Z\s]+$/)
    .optional()
    .messages({
      'string.min': 'First name must be at least 2 characters long',
      'string.max': 'First name cannot exceed 50 characters',
      'string.pattern.base': 'First name can only contain letters and spaces'
    }),
  lastName: Joi.string()
    .min(2)
    .max(50)
    .pattern(/^[a-zA-Z\s]+$/)
    .optional()
    .messages({
      'string.min': 'Last name must be at least 2 characters long',
      'string.max': 'Last name cannot exceed 50 characters',
      'string.pattern.base': 'Last name can only contain letters and spaces'
    }),
  phone: Joi.string()
    .pattern(/^[0-9+\-\s()]+$/)
    .min(10)
    .max(20)
    .optional()
    .messages({
      'string.pattern.base': 'Please provide a valid phone number',
      'string.min': 'Phone number must be at least 10 digits',
      'string.max': 'Phone number cannot exceed 20 characters'
    })
});

export class UserController {
  // GET /api/users/profile
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

      const user = await AuthService.getUserById(req.user.id);

      const response: ApiResponse = {
        success: true,
        data: { user }
      };

      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to get user profile'
        }
      };
      res.status(500).json(response);
    }
  }

  // PUT /api/users/profile
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

      // Validate request data
      const validatedData = validateRequest(profileUpdateValidation, req.body);

      // Check if there's actually data to update
      if (Object.keys(validatedData).length === 0) {
        const response: ApiResponse = {
          success: false,
          error: { message: 'No valid fields provided for update' }
        };
        res.status(400).json(response);
        return;
      }

      // Update user profile
      const user = await AuthService.updateUserProfile(req.user.id, validatedData);

      const response: ApiResponse = {
        success: true,
        data: {
          user,
          message: 'Profile updated successfully'
        }
      };

      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to update profile'
        }
      };
      res.status(500).json(response);
    }
  }

  // DELETE /api/users/account
  static async deleteAccount(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        const response: ApiResponse = {
          success: false,
          error: { message: 'User not authenticated' }
        };
        res.status(401).json(response);
        return;
      }

      // Delete user account
      const result = await AuthService.deleteUserAccount(req.user.id);

      const response: ApiResponse = {
        success: true,
        data: result
      };

      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to delete account'
        }
      };
      res.status(500).json(response);
    }
  }
} 