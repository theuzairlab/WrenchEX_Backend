import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { validateRequest, registerValidation, loginValidation } from '../utils/validators';
import { ApiResponse } from '../types';

export class AuthController {
  // POST /api/auth/register
  static async register(req: Request, res: Response) {
    try {
      // Validate request data
      const validatedData = validateRequest(registerValidation, req.body);

      // Register user
      const result = await AuthService.registerUser(validatedData);

      const response: ApiResponse = {
        success: true,
        data: {
          user: result.user,
          token: result.token,
          message: 'Registration successful'
        }
      };

      res.status(201).json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Registration failed'
        }
      };
      res.status(400).json(response);
    }
  }

  // POST /api/auth/login
  static async login(req: Request, res: Response) {
    try {
      // Validate request data
      const validatedData = validateRequest(loginValidation, req.body);
      const { email, password } = validatedData;

      // Login user
      const result = await AuthService.loginUser(email, password);

      const response: ApiResponse = {
        success: true,
        data: {
          user: result.user,
          token: result.token,
          message: 'Login successful'
        }
      };

      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Login failed'
        }
      };
      res.status(401).json(response);
    }
  }

  // POST /api/auth/google
  static async googleLogin(req: Request, res: Response): Promise<void> {
    try {
      const { idToken } = req.body;

      if (!idToken) {
        const response: ApiResponse = {
          success: false,
          error: { message: 'Google ID token is required' }
        };
        res.status(400).json(response);
        return;
      }

      // Google login
      const result = await AuthService.googleLogin(idToken);

      const response: ApiResponse = {
        success: true,
        data: {
          user: result.user,
          token: result.token,
          message: 'Google login successful'
        }
      };

      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Google login failed'
        }
      };
      res.status(401).json(response);
    }
  }

  // POST /api/auth/logout
  static async logout(req: Request, res: Response) {
    try {
      // In a stateless JWT system, logout is handled on the frontend
      // by removing the token. Here we just confirm the logout
      const response: ApiResponse = {
        success: true,
        data: { message: 'Logout successful' }
      };

      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Logout failed'
        }
      };
      res.status(500).json(response);
    }
  }

  // GET /api/auth/me
  static async getCurrentUser(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        const response: ApiResponse = {
          success: false,
          error: { message: 'User not authenticated' }
        };
        res.status(401).json(response);
        return;
      }

      // Get detailed user info
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

  // POST /api/auth/verify-email
  static async verifyEmail(req: Request, res: Response) {
    try {
      // For now, just return success
      // TODO: Implement email verification logic
      const response: ApiResponse = {
        success: true,
        data: { message: 'Email verification feature coming soon' }
      };

      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Email verification failed'
        }
      };
      res.status(500).json(response);
    }
  }
} 