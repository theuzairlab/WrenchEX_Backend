import prisma from '../config/database';
import { UserRole, AppointmentStatus } from '../types';

export class AdminService {
  // Get platform statistics (chat-focused)
  static async getPlatformStats() {
    const [
      totalUsers,
      totalSellers, 
      totalProducts,
      totalServices,
      totalAppointments,
      totalChats,
      activeChats
    ] = await Promise.all([
      prisma.user.count(),
      prisma.seller.count(),
      prisma.product.count(),
      prisma.service.count(),
      prisma.appointment.count(),
      prisma.productChat.count(),
      prisma.productChat.count({
        where: {
          isActive: true,
          messages: {
            some: {
              createdAt: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
              }
            }
          }
        }
      })
    ]);

    return {
      users: { total: totalUsers },
      sellers: { total: totalSellers },
      products: { total: totalProducts },
      services: { total: totalServices },
      appointments: { total: totalAppointments },
      chats: { 
        total: totalChats,
        active: activeChats
      }
    };
  }

  // Get user management data
  static async getUsers(filters: {
    role?: UserRole;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { role, search, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (role) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          seller: {
            select: {
              id: true,
              shopName: true,
              isApproved: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Get sellers for approval
  static async getSellers(filters: {
    isApproved?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { isApproved, search, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (typeof isApproved === 'boolean') {
      where.isApproved = isApproved;
    }

    if (search) {
      where.OR = [
        { shopName: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { user: { 
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } }
          ]
        }}
      ];
    }

    const [sellers, total] = await Promise.all([
      prisma.seller.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              createdAt: true
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
        orderBy: { createdAt: 'desc' }
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

  // Approve/reject seller
  static async updateSellerApproval(sellerId: string, isApproved: boolean) {
    const seller = await prisma.seller.findUnique({
      where: { id: sellerId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (!seller) {
      throw new Error('Seller not found');
    }

    const updatedSeller = await prisma.seller.update({
      where: { id: sellerId },
      data: { isApproved },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    return updatedSeller;
  }

  // Get chat reports
  static async getChatReports(filters: {
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    const { startDate, endDate, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [chats, total] = await Promise.all([
      prisma.productChat.findMany({
        where,
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
              lastName: true,
              email: true
            }
          },
          seller: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          _count: {
            select: {
              messages: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.productChat.count({ where })
    ]);

    return {
      chats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Delete chat (moderation)
  static async deleteChat(chatId: string) {
    const chat = await prisma.productChat.findUnique({
      where: { id: chatId }
    });

    if (!chat) {
      throw new Error('Chat not found');
    }

    // Delete messages first, then chat
    await prisma.productMessage.deleteMany({
      where: { chatId }
    });

    await prisma.productChat.delete({
      where: { id: chatId }
    });

    return { success: true };
  }

  // Get appointment reports  
  static async getAppointments(filters: {
    status?: AppointmentStatus;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    const { status, startDate, endDate, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        include: {
          buyer: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          },
          seller: {
            select: {
              shopName: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          },
          service: {
            select: {
              title: true,
              price: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.appointment.count({ where })
    ]);

    return {
      appointments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }
}
