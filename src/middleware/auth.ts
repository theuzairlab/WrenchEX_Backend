import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { UserRole, JwtPayload } from '../types';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
        firstName: string;
        lastName: string;
      };
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      res.status(401).json({
        success: false,
        error: { message: 'No token, authorization denied' }
      });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        isVerified: true
      }
    });

    if (!user) {
      res.status(401).json({
        success: false,
        error: { message: 'Token is not valid' }
      });
      return;
    }

    if (!user.isVerified) {
      res.status(401).json({
        success: false,
        error: { message: 'Please verify your email to access this resource' }
      });
      return;
    }

    req.user = {
      ...user,
      role: user.role as UserRole
    };
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({
      success: false,
      error: { message: 'Token is not valid' }
    });
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: 'User not authenticated' }
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: { message: `User role '${req.user.role}' is not authorized to access this resource` }
      });
      return;
    }

    next();
  };
};

export const checkSellerApproval = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user?.role !== 'SELLER') {
      return next();
    }

    const seller = await prisma.seller.findUnique({
      where: { userId: req.user.id },
      select: { isApproved: true }
    });

    if (!seller?.isApproved) {
      res.status(403).json({
        success: false,
        error: { message: 'Your seller account is pending approval' }
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Seller approval check error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Server error during seller verification' }
    });
  }
}; 