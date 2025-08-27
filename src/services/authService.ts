import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import prisma from '../config/database';
import { UserRole, JwtPayload } from '../types';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export class AuthService {
  // Hash password
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  // Compare password
  static async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  // Generate JWT token
  static generateToken(payload: JwtPayload): string {
    return jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: '7d'
    });
  }

  // Verify JWT token
  static verifyToken(token: string): JwtPayload {
    return jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
  }

  // Register new user
  static async registerUser(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role?: UserRole;
    shopName?: string;
    shopAddress?: string;
    businessType?: string;
    description?: string;
  }) {
    const { 
      email, 
      password, 
      firstName, 
      lastName, 
      phone, 
      role = UserRole.BUYER,
      shopName,
      shopAddress,
      businessType,
      description
    } = userData;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const passwordHash = await this.hashPassword(password);

    // Create user with transaction for sellers
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          passwordHash,
          firstName,
          lastName,
          phone,
          role,
          isVerified: true // For now, auto-verify. Later add email verification
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          isVerified: true,
          createdAt: true
        }
      });

      // If user is a seller, create seller profile
      if (role === UserRole.SELLER) {
        if (!shopName || !shopAddress || !businessType) {
          throw new Error('Shop name, address, and business type are required for sellers');
        }

        const seller = await tx.seller.create({
          data: {
            userId: user.id,
            shopName,
            shopDescription: description,
            shopAddress,
            city: 'Not specified', // Can be extracted from address later
            area: 'Not specified', // Can be extracted from address later
            businessType,
            isApproved: false // Sellers need admin approval
          }
        });

        // Create seller chat settings
        await tx.sellerChatSettings.create({
          data: {
            sellerId: seller.id, // Use the actual seller record ID
            showPhone: false,
            isOnline: false
          }
        });
      }

      return user;
    });

    const user = result;

    // Generate token
    const token = this.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role as UserRole
    });

    return { user, token };
  }

  // Login user
  static async loginUser(email: string, password: string) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isVerified: true
      }
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check password
    if (!user.passwordHash) {
      throw new Error('Please sign in with Google or reset your password');
    }

    const isValidPassword = await this.comparePassword(password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    if (!user.isVerified) {
      throw new Error('Please verify your email before signing in');
    }

    // Generate token
    const token = this.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role as UserRole
    });

    // Remove password hash from response
    const { passwordHash, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, token };
  }

  // Google OAuth login
  static async googleLogin(idToken: string) {
    try {
      // Verify Google token
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new Error('Invalid Google token');
      }

      const { sub: googleId, email, given_name: firstName, family_name: lastName } = payload;

      if (!email) {
        throw new Error('Email not provided by Google');
      }

      // Check if user exists
      let user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: email.toLowerCase() },
            { googleId }
          ]
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          isVerified: true,
          googleId: true
        }
      });

      if (user) {
        // Update Google ID if not set
        if (!user.googleId) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { googleId },
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              role: true,
              isVerified: true,
              googleId: true
            }
          });
        }
      } else {
        // Create new user
        user = await prisma.user.create({
          data: {
            email: email.toLowerCase(),
            googleId,
            firstName: firstName || 'Google',
            lastName: lastName || 'User',
            role: UserRole.BUYER,
            isVerified: true
          },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            role: true,
            isVerified: true,
            googleId: true
          }
        });
      }

      // Generate token
      const token = this.generateToken({
        userId: user.id,
        email: user.email,
        role: user.role as UserRole
      });

      return { user, token };
    } catch (error) {
      throw new Error('Google authentication failed');
    }
  }

  // Get user by ID
  static async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  // Update user profile
  static async updateUserProfile(userId: string, updateData: {
    firstName?: string;
    lastName?: string;
    phone?: string;
  }) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isVerified: true,
        updatedAt: true
      }
    });

    return user;
  }

  // Delete user account
  static async deleteUserAccount(userId: string) {
    // First check if user is a seller with active products/services
    const seller = await prisma.seller.findUnique({
      where: { userId },
      include: {
        products: { where: { isActive: true } },
        services: { where: { isActive: true } }
      }
    });

    if (seller && (seller.products.length > 0 || seller.services.length > 0)) {
      throw new Error('Cannot delete account with active products or services. Please deactivate them first.');
    }

    // Delete user (cascade will handle related data)
    await prisma.user.delete({
      where: { id: userId }
    });

    return { message: 'Account deleted successfully' };
  }
} 