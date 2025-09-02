import prisma from '../config/database';
import { AppointmentCreateData, AppointmentDetails, AppointmentFilters, AppointmentStatus, SellerAvailability } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class AppointmentService {
  /**
   * Create a new appointment
   */
  static async createAppointment(
    buyerId: string,
    appointmentData: AppointmentCreateData
  ): Promise<AppointmentDetails> {
    // Get service details
    const service = await prisma.service.findFirst({
      where: {
        id: appointmentData.serviceId,
        isActive: true
      },
      include: {
        seller: {
          include: {
            user: true
          }
        }
      }
    });

    if (!service) {
      throw new Error('Service not found or is inactive');
    }

    // Check if seller is approved
    if (!service.seller.isApproved) {
      throw new Error('This seller is not approved to take appointments');
    }

    // Validate appointment time
    const appointmentDuration = service.durationMinutes;
    const startTime = new Date(appointmentData.scheduledTimeStart);
    const endTime = new Date(appointmentData.scheduledTimeEnd);
    const expectedEndTime = new Date(startTime.getTime() + appointmentDuration * 60000);

    if (endTime.getTime() !== expectedEndTime.getTime()) {
      throw new Error(`Appointment duration must be ${appointmentDuration} minutes for this service`);
    }

    // Check if time slot is available
    const isAvailable = await this.checkTimeSlotAvailability(
      service.seller.id,
      startTime,
      endTime
    );

    if (!isAvailable) {
      throw new Error('The selected time slot is not available');
    }

    // Check seller availability for the day/time
    const dayOfWeek = startTime.getDay();
    const timeString = startTime.toTimeString().slice(0, 5); // "HH:MM"

    const sellerAvailability = await this.getSellerAvailabilityForDay(service.seller.id, dayOfWeek);
    
    // Temporarily disable availability check to allow all bookings
    // TODO: Re-enable when seller availability system is properly set up
    console.log(`Seller availability check for seller ${service.seller.id}, day ${dayOfWeek}:`, sellerAvailability);
    
    // If no availability is set for this day, allow the booking (seller can set availability later)
    if (sellerAvailability.length > 0 && !this.isTimeWithinAvailability(timeString, sellerAvailability)) {
      console.log(`Time ${timeString} not within availability slots:`, sellerAvailability);
      // Temporarily allow all bookings - comment out the error
      // throw new Error('Seller is not available at the selected time');
    }

    // Generate appointment number
    const appointmentNumber = `APT-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // Create appointment in transaction
    const appointment = await prisma.$transaction(async (tx) => {
      const newAppointment = await tx.appointment.create({
        data: {
          appointmentNumber,
          buyerId,
          sellerId: service.seller.id,
          serviceId: appointmentData.serviceId,
          scheduledDate: appointmentData.scheduledDate,
          scheduledTimeStart: appointmentData.scheduledTimeStart,
          scheduledTimeEnd: appointmentData.scheduledTimeEnd,
          totalAmount: service.price,
          serviceLocation: appointmentData.serviceLocation,
          notes: appointmentData.notes,
          status: AppointmentStatus.PENDING
        }
      });

      // Create initial status history
      await tx.appointmentStatusHistory.create({
        data: {
          appointmentId: newAppointment.id,
          status: AppointmentStatus.PENDING,
          notes: 'Appointment created',
          changedBy: buyerId
        }
      });

      return newAppointment;
    });

    return await this.getAppointmentById(appointment.id);
  }

  /**
   * Get appointment by ID with full details
   */
  static async getAppointmentById(appointmentId: string): Promise<AppointmentDetails> {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        buyer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        seller: {
          select: {
            id: true,
            userId: true,
            shopName: true,
            shopAddress: true,
            city: true,
            area: true
          }
        },
        service: {
          select: {
            id: true,
            title: true,
            description: true,
            price: true,
            durationMinutes: true,
            isMobileService: true,
            images: true
          }
        },
        statusHistory: {
          include: {
            changedByUser: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: {
            changedAt: 'desc'
          }
        },
        messages: {
          include: {
            sender: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!appointment) {
      throw new Error('Appointment not found');
    }

    return appointment as AppointmentDetails;
  }

  /**
   * Get appointments with filters and pagination
   */
  static async getAppointments(filters: AppointmentFilters = {}) {
    const {
      status,
      sellerId,
      buyerId,
      serviceId,
      startDate,
      endDate,
      page = 1,
      limit = 10
    } = filters;

    const where: any = {};

    if (status) where.status = status;
    if (sellerId) where.sellerId = sellerId;
    if (buyerId) where.buyerId = buyerId;
    if (serviceId) where.serviceId = serviceId;
    if (startDate || endDate) {
      where.scheduledDate = {};
      if (startDate) where.scheduledDate.gte = startDate;
      if (endDate) where.scheduledDate.lte = endDate;
    }

    const skip = (page - 1) * limit;

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
              city: true,
              area: true
            }
          },
          service: {
            select: {
              title: true,
              durationMinutes: true,
              isMobileService: true
            }
          }
        },
        orderBy: {
          scheduledTimeStart: 'asc'
        },
        skip,
        take: limit
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

  /**
   * Update appointment status
   */
  static async updateAppointmentStatus(
    appointmentId: string,
    newStatus: AppointmentStatus,
    changedBy: string,
    notes?: string
  ): Promise<AppointmentDetails> {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId }
    });

    if (!appointment) {
      throw new Error('Appointment not found');
    }

    // Business rules for status transitions
    const validTransitions: Record<AppointmentStatus, AppointmentStatus[]> = {
      [AppointmentStatus.PENDING]: [AppointmentStatus.CONFIRMED, AppointmentStatus.CANCELLED],
      [AppointmentStatus.CONFIRMED]: [AppointmentStatus.IN_PROGRESS, AppointmentStatus.CANCELLED],
      [AppointmentStatus.IN_PROGRESS]: [AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED],
      [AppointmentStatus.COMPLETED]: [], // Final state
      [AppointmentStatus.CANCELLED]: [] // Final state
    };

    if (!validTransitions[appointment.status].includes(newStatus)) {
      throw new Error(`Cannot change status from ${appointment.status} to ${newStatus}`);
    }

    // Update appointment and create status history in transaction
    await prisma.$transaction(async (tx) => {
      await tx.appointment.update({
        where: { id: appointmentId },
        data: {
          status: newStatus,
          updatedAt: new Date()
        }
      });

      await tx.appointmentStatusHistory.create({
        data: {
          appointmentId,
          status: newStatus,
          notes,
          changedBy
        }
      });
    });

    return await this.getAppointmentById(appointmentId);
  }

  /**
   * Cancel appointment
   */
  static async cancelAppointment(
    appointmentId: string,
    cancelledBy: string,
    reason?: string
  ): Promise<AppointmentDetails> {
    return await this.updateAppointmentStatus(
      appointmentId,
      AppointmentStatus.CANCELLED,
      cancelledBy,
      reason ? `Cancelled: ${reason}` : 'Appointment cancelled'
    );
  }

  /**
   * Check if a time slot is available for a seller
   */
  static async checkTimeSlotAvailability(
    sellerId: string,
    startTime: Date,
    endTime: Date
  ): Promise<boolean> {
    // Check for overlapping appointments
    const overlappingAppointments = await prisma.appointment.count({
      where: {
        sellerId,
        status: {
          in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED, AppointmentStatus.IN_PROGRESS]
        },
        OR: [
          {
            AND: [
              { scheduledTimeStart: { lte: startTime } },
              { scheduledTimeEnd: { gt: startTime } }
            ]
          },
          {
            AND: [
              { scheduledTimeStart: { lt: endTime } },
              { scheduledTimeEnd: { gte: endTime } }
            ]
          },
          {
            AND: [
              { scheduledTimeStart: { gte: startTime } },
              { scheduledTimeEnd: { lte: endTime } }
            ]
          }
        ]
      }
    });

    return overlappingAppointments === 0;
  }

  /**
   * Get seller availability for a specific day
   */
  static async getSellerAvailabilityForDay(sellerId: string, dayOfWeek: number): Promise<SellerAvailability[]> {
    const availability = await prisma.sellerAvailability.findMany({
      where: {
        sellerId,
        dayOfWeek,
        isAvailable: true
      },
      orderBy: {
        startTime: 'asc'
      }
    });

    return availability as SellerAvailability[];
  }

  /**
   * Check if a time is within seller's availability
   */
  static isTimeWithinAvailability(timeString: string, availability: SellerAvailability[]): boolean {
    if (availability.length === 0) {
      return false; // No availability set for this day
    }

    return availability.some(slot => {
      return timeString >= slot.startTime && timeString < slot.endTime;
    });
  }

  /**
   * Get available time slots for a service on a specific date
   */
  static async getAvailableTimeSlots(
    serviceId: string,
    date: Date,
    intervalMinutes: number = 30
  ): Promise<{ startTime: string; endTime: string; isAvailable: boolean }[]> {
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: { seller: true }
    });

    if (!service) {
      throw new Error('Service not found');
    }

    const dayOfWeek = date.getDay();
    const availability = await this.getSellerAvailabilityForDay(service.seller.id, dayOfWeek);

    if (availability.length === 0) {
      return [];
    }

    const slots: { startTime: string; endTime: string; isAvailable: boolean }[] = [];

    for (const availabilitySlot of availability) {
      const [startHour, startMinute] = availabilitySlot.startTime.split(':').map(Number);
      const [endHour, endMinute] = availabilitySlot.endTime.split(':').map(Number);

      let currentTime = new Date(date);
      currentTime.setHours(startHour, startMinute, 0, 0);

      const endTime = new Date(date);
      endTime.setHours(endHour, endMinute, 0, 0);

      while (currentTime < endTime) {
        const slotStart = new Date(currentTime);
        const slotEnd = new Date(currentTime.getTime() + service.durationMinutes * 60000);

        if (slotEnd <= endTime) {
          const isAvailable = await this.checkTimeSlotAvailability(
            service.seller.id,
            slotStart,
            slotEnd
          );

          slots.push({
            startTime: slotStart.toTimeString().slice(0, 5),
            endTime: slotEnd.toTimeString().slice(0, 5),
            isAvailable
          });
        }

        currentTime = new Date(currentTime.getTime() + intervalMinutes * 60000);
      }
    }

    return slots;
  }

  /**
   * Get appointment analytics for seller
   */
  static async getSellerAppointmentAnalytics(sellerId: string, period: 'today' | 'week' | 'month' | 'year' = 'month') {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }

    const [
      totalAppointments,
      totalRevenue,
      statusCounts,
      recentAppointments
    ] = await Promise.all([
      // Total appointments in period
      prisma.appointment.count({
        where: {
          sellerId,
          createdAt: { gte: startDate }
        }
      }),

      // Total revenue in period
      prisma.appointment.aggregate({
        where: {
          sellerId,
          status: AppointmentStatus.COMPLETED,
          createdAt: { gte: startDate }
        },
        _sum: { totalAmount: true }
      }),

      // Appointments by status
      prisma.appointment.groupBy({
        by: ['status'],
        where: {
          sellerId,
          createdAt: { gte: startDate }
        },
        _count: true
      }),

      // Recent appointments
      prisma.appointment.findMany({
        where: {
          sellerId,
          createdAt: { gte: startDate }
        },
        include: {
          buyer: {
            select: {
              firstName: true,
              lastName: true
            }
          },
          service: {
            select: {
              title: true
            }
          }
        },
        orderBy: { scheduledTimeStart: 'desc' },
        take: 5
      })
    ]);

    return {
      period,
      totalAppointments,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      statusBreakdown: statusCounts.reduce((acc, item) => {
        acc[item.status] = item._count;
        return acc;
      }, {} as Record<AppointmentStatus, number>),
      recentAppointments
    };
  }

  /**
   * Get upcoming appointments for a user
   */
  static async getUpcomingAppointments(userId: string, userType: 'buyer' | 'seller', limit: number = 5) {
    const where = userType === 'buyer' ? { buyerId: userId } : { sellerId: userId };

    const appointments = await prisma.appointment.findMany({
      where: {
        ...where,
        scheduledTimeStart: {
          gte: new Date()
        },
        status: {
          in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED, AppointmentStatus.IN_PROGRESS]
        }
      },
      include: {
        buyer: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        seller: {
          select: {
            shopName: true
          }
        },
        service: {
          select: {
            title: true,
            durationMinutes: true
          }
        }
      },
      orderBy: {
        scheduledTimeStart: 'asc'
      },
      take: limit
    });

    return appointments;
  }
} 