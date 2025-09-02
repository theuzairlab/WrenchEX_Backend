import prisma from '../config/database';
import { ServiceDetails, ServiceFilters } from '../types';

export class ServiceService {
  /**
   * Create a new service
   */
  static async createService(sellerId: string, serviceData: {
    title: string;
    description: string;
    categoryId: string;
    price: number;
    durationMinutes: number;
    isMobileService: boolean;
    images?: string[];
  }): Promise<ServiceDetails> {
    // Check if seller exists and is approved
    const seller = await prisma.seller.findUnique({
      where: { id: sellerId }
    });

    if (!seller) {
      throw new Error('Seller not found');
    }

    if (!seller.isApproved) {
      throw new Error('Seller must be approved before creating services');
    }

    // Check if category exists
    const category = await prisma.category.findFirst({
      where: {
        id: serviceData.categoryId,
        isActive: true
      }
    });

    if (!category) {
      throw new Error('Category not found or is inactive');
    }

    const service = await prisma.service.create({
      data: {
        sellerId,
        title: serviceData.title,
        description: serviceData.description,
        categoryId: serviceData.categoryId,
        price: serviceData.price,
        durationMinutes: serviceData.durationMinutes,
        isMobileService: serviceData.isMobileService,
        images: serviceData.images || []
      }
    });

    return await this.getServiceById(service.id);
  }

  /**
   * Get service by ID with full details
   */
  static async getServiceById(serviceId: string): Promise<ServiceDetails> {
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        seller: {
          select: {
            shopName: true,
            shopAddress: true,
            city: true,
            area: true,
            ratingAverage: true
          }
        },
        category: {
          select: {
            name: true,
            description: true
          }
        }
      }
    });

    if (!service) {
      throw new Error('Service not found');
    }

    return service as ServiceDetails;
  }

  /**
   * Get services with filters and pagination
   */
  static async getServices(filters: ServiceFilters = {}) {
    const {
      categoryId,
      sellerId,
      city,
      area,
      isMobileService,
      minPrice,
      maxPrice,
      search,
      page = 1,
      limit = 10,
      includeInactive = false
    } = filters;

    const where: any = {
      isFlagged: false,
      seller: {
        isApproved: true
      }
    };
    
    // Only filter by active status if not including inactive
    if (!includeInactive) {
      where.isActive = true;
    }

    // Apply filters
    if (categoryId) where.categoryId = categoryId;
    if (sellerId) where.sellerId = sellerId;
    if (isMobileService !== undefined) where.isMobileService = isMobileService;
    
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = minPrice;
      if (maxPrice) where.price.lte = maxPrice;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Location filters on seller
    if (city || area) {
      where.seller = {
        ...where.seller, // Preserve existing seller filters (isApproved: true)
        ...(city && { city: { contains: city, mode: 'insensitive' } }),
        ...(area && { area: { contains: area, mode: 'insensitive' } })
      };
    }

    const skip = (page - 1) * limit;

    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where,
        include: {
          seller: {
            select: {
              shopName: true,
              shopAddress: true,
              city: true,
              area: true,
              ratingAverage: true
            }
          },
          category: {
            select: {
              name: true,
              description: true
            }
          }
        },
        orderBy: [
          { ratingAverage: 'desc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: limit
      }),
      prisma.service.count({ where })
    ]);

    return {
      services,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get services by seller
   */
  static async getServicesBySeller(sellerId: string, includeInactive: boolean = false) {
    const where: any = { sellerId };
    if (!includeInactive) {
      where.isActive = true;
    }

    const services = await prisma.service.findMany({
      where,
      include: {
        category: {
          select: {
            name: true,
            description: true
          }
        }
      },
      orderBy: [
        { isActive: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return services;
  }

  /**
   * Update service
   */
  static async updateService(
    serviceId: string,
    sellerId: string,
    updateData: Partial<{
      title: string;
      description: string;
      categoryId: string;
      price: number;
      durationMinutes: number;
      isMobileService: boolean;
      images: string[];
      isActive: boolean;
    }>
  ): Promise<ServiceDetails> {
    // Check if service exists and belongs to seller
    const service = await prisma.service.findFirst({
      where: {
        id: serviceId,
        sellerId
      }
    });

    if (!service) {
      throw new Error('Service not found or you do not have permission to update it');
    }

    // Check if category exists (if being updated)
    if (updateData.categoryId) {
      const category = await prisma.category.findFirst({
        where: {
          id: updateData.categoryId,
          isActive: true
        }
      });

      if (!category) {
        throw new Error('Category not found or is inactive');
      }
    }

    await prisma.service.update({
      where: { id: serviceId },
      data: updateData
    });

    return await this.getServiceById(serviceId);
  }

  /**
   * Toggle service status (activate/deactivate)
   */
  static async toggleServiceStatus(serviceId: string, sellerId: string) {
    // Check if service exists and belongs to seller
    const service = await prisma.service.findFirst({
      where: {
        id: serviceId,
        sellerId
      }
    });

    if (!service) {
      throw new Error('Service not found or you do not have permission to modify it');
    }

    // Toggle the active status
    const updatedService = await prisma.service.update({
      where: { id: serviceId },
      data: { isActive: !service.isActive },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return {
      service: updatedService,
      message: `Service ${updatedService.isActive ? 'activated' : 'deactivated'} successfully`
    };
  }

  /**
   * Delete service (soft delete by setting isActive to false and marking as deleted)
   */
  static async deleteService(serviceId: string, sellerId: string): Promise<void> {
    // Check if service exists and belongs to seller
    const service = await prisma.service.findFirst({
      where: {
        id: serviceId,
        sellerId
      }
    });

    if (!service) {
      throw new Error('Service not found or you do not have permission to delete it');
    }

    // Check for pending appointments
    const pendingAppointments = await prisma.appointment.count({
      where: {
        serviceId,
        status: {
          in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS']
        }
      }
    });

    if (pendingAppointments > 0) {
      throw new Error('Cannot delete service with pending or active appointments');
    }

    // Soft delete the service by setting isActive to false and adding a deleted flag
    // This preserves foreign key relationships while hiding the service
    await prisma.service.update({
      where: { id: serviceId },
      data: { 
        isActive: false,
        // You can add a deletedAt timestamp if you want to track when it was deleted
        // deletedAt: new Date()
      }
    });
  }

  /**
   * Get featured services
   */
  static async getFeaturedServices(limit: number = 8) {
    const services = await prisma.service.findMany({
      where: {
        isActive: true,
        seller: {
          isApproved: true
        }
      },
      include: {
        seller: {
          select: {
            shopName: true,
            city: true,
            area: true,
            ratingAverage: true
          }
        },
        category: {
          select: {
            name: true
          }
        }
      },
      orderBy: [
        { ratingAverage: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit
    });

    return services;
  }

  /**
   * Get mobile services (mobile mechanics)
   */
  static async getMobileServices(filters: Omit<ServiceFilters, 'isMobileService'> = {}) {
    return await this.getServices({
      ...filters,
      isMobileService: true
    });
  }

  /**
   * Get service categories
   */
  static async getServiceCategories() {
    const categories = await prisma.category.findMany({
      where: {
        isActive: true,
        services: {
          some: {}
        }
      },
      include: {
        _count: {
          select: {
            services: {
              where: {
                isActive: true
              }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return categories;
  }

  /**
   * Search services with location radius (for mobile services)
   */
  static async searchServicesNearLocation(
    latitude: number,
    longitude: number,
    radiusKm: number = 10,
    filters: Omit<ServiceFilters, 'city' | 'area'> = {}
  ) {
    // This is a simplified version. In production, you'd use PostGIS or similar
    // For now, we'll just return mobile services within the same city
    // You can enhance this with proper geospatial queries later
    
    const services = await this.getServices({
      ...filters,
      isMobileService: true
    });

    // In a real implementation, you would calculate distance and filter
    // For now, just return all mobile services
    return services;
  }
} 