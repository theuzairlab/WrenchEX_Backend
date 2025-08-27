import prisma from '../config/database';
import { UserRole } from '../types';
import { AuthService } from './authService';

export class SellerService {
  // Register seller profile (after user registration with SELLER role)
  static async registerSeller(userId: string, sellerData: {
    shopName: string;
    shopDescription?: string;
    shopAddress: string;
    city: string;
    area: string;
    latitude?: number;
    longitude?: number;
  }) {
    const { shopName, shopDescription, shopAddress, city, area, latitude, longitude } = sellerData;

    // Check if user exists and has SELLER role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, email: true, firstName: true, lastName: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.role !== 'SELLER') {
      throw new Error('User must have SELLER role to register as seller');
    }

    // Check if seller profile already exists
    const existingSeller = await prisma.seller.findUnique({
      where: { userId }
    });

    if (existingSeller) {
      throw new Error('Seller profile already exists for this user');
    }

    // Check for duplicate shop name in the same city
    const duplicateShop = await prisma.seller.findFirst({
      where: {
        shopName: {
          equals: shopName,
          mode: 'insensitive'
        },
        city: {
          equals: city,
          mode: 'insensitive'
        }
      }
    });

    if (duplicateShop) {
      throw new Error('A shop with this name already exists in this city');
    }

    // Create seller profile
    const seller = await prisma.seller.create({
      data: {
        userId,
        shopName,
        shopDescription: shopDescription || '',
        shopAddress,
        city,
        area,
        latitude,
        longitude,
        isApproved: false, // Requires admin approval
        ratingAverage: 0,
        ratingCount: 0
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true
          }
        }
      }
    });

    return seller;
  }

  // Get seller profile by user ID
  static async getSellerByUserId(userId: string) {
    const seller = await prisma.seller.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            isVerified: true
          }
        },
        _count: {
          select: {
            products: true,
            services: true,
            appointments: true
          }
        }
      }
    });

    if (!seller) {
      throw new Error('Seller profile not found');
    }

    return seller;
  }

  // Update seller profile
  static async updateSellerProfile(userId: string, updateData: {
    shopName?: string;
    shopDescription?: string;
    shopAddress?: string;
    city?: string;
    area?: string;
    latitude?: number;
    longitude?: number;
    phone?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
  }) {
    const existingSeller = await prisma.seller.findUnique({
      where: { userId },
      select: { id: true, shopName: true, city: true }
    });

    if (!existingSeller) {
      throw new Error('Seller profile not found');
    }

    // Check for duplicate shop name if changing name or city
    if ((updateData.shopName || updateData.city)) {
      const newShopName = updateData.shopName || existingSeller.shopName;
      const newCity = updateData.city || existingSeller.city;

      const duplicateShop = await prisma.seller.findFirst({
        where: {
          id: { not: existingSeller.id },
          shopName: {
            equals: newShopName,
            mode: 'insensitive'
          },
          city: {
            equals: newCity,
            mode: 'insensitive'
          }
        }
      });

      if (duplicateShop) {
        throw new Error('A shop with this name already exists in this city');
      }
    }

    // Separate seller and user data
    const sellerData: any = {};
    const userData: any = {};

    if (updateData.shopName !== undefined) sellerData.shopName = updateData.shopName;
    if (updateData.shopDescription !== undefined) sellerData.shopDescription = updateData.shopDescription;
    if (updateData.shopAddress !== undefined) sellerData.shopAddress = updateData.shopAddress;
    if (updateData.city !== undefined) sellerData.city = updateData.city;
    if (updateData.area !== undefined) sellerData.area = updateData.area;
    if (updateData.latitude !== undefined) sellerData.latitude = updateData.latitude;
    if (updateData.longitude !== undefined) sellerData.longitude = updateData.longitude;

    if (updateData.phone !== undefined) userData.phone = updateData.phone;
    if (updateData.email !== undefined) userData.email = updateData.email;
    if (updateData.firstName !== undefined) userData.firstName = updateData.firstName;
    if (updateData.lastName !== undefined) userData.lastName = updateData.lastName;

    // Update both seller and user data in a transaction
    const updatedSeller = await prisma.$transaction(async (tx) => {
      // Update seller data if there are changes
      if (Object.keys(sellerData).length > 0) {
        await tx.seller.update({
          where: { userId },
          data: sellerData
        });
      }

      // Update user data if there are changes
      if (Object.keys(userData).length > 0) {
        await tx.user.update({
          where: { id: userId },
          data: userData
        });
      }

      // Return updated seller with user data
      return await tx.seller.findUnique({
        where: { userId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true
            }
          },
          _count: {
            select: {
              products: true,
              services: true,
              appointments: true
            }
          }
        }
      });
    });

    return updatedSeller;
  }

  // Get seller dashboard data with chat metrics
  static async getSellerDashboard(userId: string) {
    const seller = await prisma.seller.findUnique({
      where: { userId },
      include: {
        user: true,
        _count: {
          select: {
            products: true,
            services: true,
            appointments: true
          }
        }
      }
    });

    if (!seller) {
      throw new Error('Seller profile not found');
    }

    if (!seller.isApproved) {
      throw new Error('Seller account is not approved yet');
    }

    // Get recent appointments instead of orders
    const recentAppointments = await prisma.appointment.findMany({
      where: { sellerId: seller.id },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        buyer: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        service: {
          select: {
            title: true,
            price: true
          }
        }
      }
    });

    // Get chat statistics
    const chatStats = await prisma.productChat.aggregate({
      where: { 
        sellerId: userId // ProductChat.sellerId refers to User.id
      },
      _count: {
        id: true
      }
    });

    const activeChatCount = await prisma.productChat.count({
      where: {
        sellerId: userId,
        isActive: true,
        messages: {
          some: {
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
            }
          }
        }
      }
    });

    // Get unread messages count
    const unreadMessages = await prisma.productMessage.count({
      where: {
        chat: {
          sellerId: userId
        },
        senderId: { not: userId },
        isRead: false
      }
    });

    // Get recent chats for dashboard
    const recentChats = await prisma.productChat.findMany({
      where: { 
        sellerId: userId // ProductChat.sellerId refers to User.id
      },
      take: 5,
      orderBy: { updatedAt: 'desc' },
      include: {
        product: {
          select: {
            id: true,
            title: true
          }
        },
        buyer: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: {
            message: true,
            senderId: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            messages: {
              where: {
                senderId: { not: userId },
                isRead: false
              }
            }
          }
        }
      }
    });

    // Format recent chats with last message and unread count
    const formattedRecentChats = recentChats.map(chat => ({
      id: chat.id,
      product: chat.product,
      buyer: chat.buyer,
      lastMessage: chat.messages[0]?.message || null,
      unreadCount: chat._count.messages,
      updatedAt: chat.updatedAt
    }));

    // Get monthly earnings (appointments only now)
    const monthlyEarnings = await prisma.appointment.aggregate({
      where: {
        sellerId: seller.id,
        status: 'COMPLETED',
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      },
      _sum: {
        totalAmount: true
      }
    });

    return {
      seller: {
        ...seller,
        totalProducts: seller._count.products,
        totalServices: seller._count.services,
        totalAppointments: seller._count.appointments,
        totalChats: chatStats._count.id,
        activeChats: activeChatCount,
        unreadMessages
      },
      recentAppointments,
      recentChats: formattedRecentChats,
      monthlyEarnings: monthlyEarnings._sum.totalAmount || 0,
      stats: {
        products: seller._count.products,
        services: seller._count.services,
        appointments: seller._count.appointments,
        chats: chatStats._count.id,
        activeChats: activeChatCount,
        unreadMessages
      }
    };
  }

  // Get seller earnings (appointments only)
  static async getSellerEarnings(userId: string, period: 'week' | 'month' | 'year' = 'month') {
    const seller = await prisma.seller.findUnique({
      where: { userId },
      select: { id: true, isApproved: true }
    });

    if (!seller) {
      throw new Error('Seller profile not found');
    }

    if (!seller.isApproved) {
      throw new Error('Seller account is not approved yet');
    }

    let startDate: Date;
    const now = new Date();

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Only appointments generate earnings now
    const appointmentsEarnings = await prisma.appointment.aggregate({
      where: {
        sellerId: seller.id,
        status: 'COMPLETED',
        createdAt: {
          gte: startDate
        }
      },
      _sum: {
        totalAmount: true
      },
      _count: {
        id: true
      }
    });

    const totalEarnings = appointmentsEarnings._sum.totalAmount || 0;

    return {
      period,
      totalEarnings,
      appointmentsEarnings: appointmentsEarnings._sum.totalAmount || 0,
      totalAppointments: appointmentsEarnings._count.id || 0,
      breakdown: {
        appointments: {
          earnings: appointmentsEarnings._sum.totalAmount || 0,
          count: appointmentsEarnings._count.id || 0
        }
      }
    };
  }

  // Search sellers
  static async searchSellers(query: {
    search?: string;
    city?: string;
    area?: string;
    isApproved?: boolean;
    page?: number;
    limit?: number;
  }) {
    const {
      search = '',
      city,
      area,
      isApproved = true,
      page = 1,
      limit = 10
    } = query;

    const skip = (page - 1) * limit;
    
    const where: any = {
      isApproved
    };

    if (search) {
      where.OR = [
        { shopName: { contains: search, mode: 'insensitive' } },
        { shopDescription: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (city) {
      where.city = { equals: city, mode: 'insensitive' };
    }

    if (area) {
      where.area = { equals: area, mode: 'insensitive' };
    }

    const [sellers, total] = await Promise.all([
      prisma.seller.findMany({
        where,
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true
            }
          },
          _count: {
            select: {
              products: true,
              services: true,
              appointments: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: [
          { ratingAverage: 'desc' },
          { createdAt: 'desc' }
        ]
      }),
      prisma.seller.count({ where })
    ]);

    return {
      sellers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Get all cities with sellers
  static async getSellerCities() {
    const cities = await prisma.seller.groupBy({
      by: ['city'],
      where: { isApproved: true },
      _count: {
        id: true
      },
      orderBy: {
        city: 'asc'
      }
    });

    return cities.map(city => ({
      name: city.city,
      sellersCount: city._count.id
    }));
  }

  // Get areas in a city with sellers
  static async getSellerAreasInCity(city: string) {
    const areas = await prisma.seller.groupBy({
      by: ['area'],
      where: { 
        city: { equals: city, mode: 'insensitive' },
        isApproved: true 
      },
      _count: {
        id: true
      },
      orderBy: {
        area: 'asc'
      }
    });

    return areas.map(area => ({
      name: area.area,
      sellersCount: area._count.id
    }));
  }
}