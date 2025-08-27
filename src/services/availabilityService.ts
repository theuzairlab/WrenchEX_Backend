import prisma from '../config/database';
import { SellerAvailability, SellerTimeOff } from '../types';

export class AvailabilityService {
  /**
   * Set seller availability for a specific day
   */
  static async setSellerAvailability(
    sellerId: string,
    dayOfWeek: number,
    startTime: string,
    endTime: string,
    isAvailable: boolean = true
  ): Promise<SellerAvailability> {
    const availability = await prisma.sellerAvailability.upsert({
      where: {
        sellerId_dayOfWeek: {
          sellerId,
          dayOfWeek
        }
      },
      update: {
        startTime,
        endTime,
        isAvailable
      },
      create: {
        sellerId,
        dayOfWeek,
        startTime,
        endTime,
        isAvailable
      }
    });

    return availability as SellerAvailability;
  }

  /**
   * Get seller availability for all days
   */
  static async getSellerAvailability(sellerId: string): Promise<SellerAvailability[]> {
    const availability = await prisma.sellerAvailability.findMany({
      where: { sellerId },
      orderBy: { dayOfWeek: 'asc' }
    });

    return availability as SellerAvailability[];
  }

  /**
   * Set seller availability for multiple days
   */
  static async setWeeklyAvailability(
    sellerId: string,
    weeklySchedule: Array<{
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      isAvailable: boolean;
    }>
  ): Promise<SellerAvailability[]> {
    const results = await Promise.all(
      weeklySchedule.map(schedule =>
        this.setSellerAvailability(
          sellerId,
          schedule.dayOfWeek,
          schedule.startTime,
          schedule.endTime,
          schedule.isAvailable
        )
      )
    );

    return results;
  }

  /**
   * Add seller time off
   */
  static async addTimeOff(
    sellerId: string,
    startDate: Date,
    endDate: Date,
    reason?: string
  ): Promise<SellerTimeOff> {
    // Check for overlapping time off
    const overlapping = await prisma.sellerTimeOff.findFirst({
      where: {
        sellerId,
        isActive: true,
        OR: [
          {
            AND: [
              { startDate: { lte: startDate } },
              { endDate: { gt: startDate } }
            ]
          },
          {
            AND: [
              { startDate: { lt: endDate } },
              { endDate: { gte: endDate } }
            ]
          },
          {
            AND: [
              { startDate: { gte: startDate } },
              { endDate: { lte: endDate } }
            ]
          }
        ]
      }
    });

    if (overlapping) {
      throw new Error('Time off period overlaps with existing time off');
    }

    // Check for appointments during this period
    const appointmentsDuringTimeOff = await prisma.appointment.count({
      where: {
        sellerId,
        status: {
          in: ['PENDING', 'CONFIRMED']
        },
        scheduledDate: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    if (appointmentsDuringTimeOff > 0) {
      throw new Error('Cannot add time off when there are pending or confirmed appointments during this period');
    }

    const timeOff = await prisma.sellerTimeOff.create({
      data: {
        sellerId,
        startDate,
        endDate,
        reason,
        isActive: true
      }
    });

    return timeOff as SellerTimeOff;
  }

  /**
   * Get seller time off periods
   */
  static async getSellerTimeOff(sellerId: string, includeInactive: boolean = false): Promise<SellerTimeOff[]> {
    const where: any = { sellerId };
    if (!includeInactive) {
      where.isActive = true;
    }

    const timeOff = await prisma.sellerTimeOff.findMany({
      where,
      orderBy: { startDate: 'asc' }
    });

    return timeOff as SellerTimeOff[];
  }

  /**
   * Remove time off
   */
  static async removeTimeOff(timeOffId: string, sellerId: string): Promise<void> {
    const timeOff = await prisma.sellerTimeOff.findFirst({
      where: {
        id: timeOffId,
        sellerId
      }
    });

    if (!timeOff) {
      throw new Error('Time off not found or you do not have permission to remove it');
    }

    await prisma.sellerTimeOff.update({
      where: { id: timeOffId },
      data: { isActive: false }
    });
  }

  /**
   * Check if seller is available on a specific date and time
   */
  static async isSellerAvailable(
    sellerId: string,
    date: Date,
    startTime: Date,
    endTime: Date
  ): Promise<{ available: boolean; reason?: string }> {
    const dayOfWeek = date.getDay();
    const timeString = startTime.toTimeString().slice(0, 5); // "HH:MM"

    // Check regular availability
    const availability = await prisma.sellerAvailability.findUnique({
      where: {
        sellerId_dayOfWeek: {
          sellerId,
          dayOfWeek
        }
      }
    });

    if (!availability || !availability.isAvailable) {
      return { available: false, reason: 'Seller not available on this day' };
    }

    // Check if time is within availability window
    if (timeString < availability.startTime || timeString >= availability.endTime) {
      return { available: false, reason: 'Time is outside seller\'s available hours' };
    }

    // Check for time off
    const timeOff = await prisma.sellerTimeOff.findFirst({
      where: {
        sellerId,
        isActive: true,
        startDate: { lte: date },
        endDate: { gte: date }
      }
    });

    if (timeOff) {
      return { available: false, reason: 'Seller is on time off during this period' };
    }

    // Check for existing appointments
    const overlappingAppointments = await prisma.appointment.count({
      where: {
        sellerId,
        status: {
          in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS']
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

    if (overlappingAppointments > 0) {
      return { available: false, reason: 'Time slot is already booked' };
    }

    return { available: true };
  }

  /**
   * Get seller's calendar for a date range
   */
  static async getSellerCalendar(
    sellerId: string,
    startDate: Date,
    endDate: Date
  ) {
    const [appointments, timeOff, availability] = await Promise.all([
      // Get appointments in the date range
      prisma.appointment.findMany({
        where: {
          sellerId,
          scheduledDate: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          service: {
            select: {
              title: true,
              durationMinutes: true
            }
          },
          buyer: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: {
          scheduledTimeStart: 'asc'
        }
      }),

      // Get time off periods
      prisma.sellerTimeOff.findMany({
        where: {
          sellerId,
          isActive: true,
          OR: [
            {
              AND: [
                { startDate: { lte: endDate } },
                { endDate: { gte: startDate } }
              ]
            }
          ]
        }
      }),

      // Get weekly availability
      prisma.sellerAvailability.findMany({
        where: { sellerId },
        orderBy: { dayOfWeek: 'asc' }
      })
    ]);

    return {
      appointments,
      timeOff,
      availability,
      dateRange: {
        startDate,
        endDate
      }
    };
  }

  /**
   * Get next available slot for a service
   */
  static async getNextAvailableSlot(
    serviceId: string,
    fromDate: Date = new Date(),
    daysAhead: number = 30
  ): Promise<{ date: Date; startTime: Date; endTime: Date } | null> {
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: { seller: true }
    });

    if (!service) {
      throw new Error('Service not found');
    }

    const endDate = new Date(fromDate.getTime() + daysAhead * 24 * 60 * 60 * 1000);
    let currentDate = new Date(fromDate);
    currentDate.setHours(0, 0, 0, 0);

    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      
      // Get availability for this day
      const availability = await prisma.sellerAvailability.findUnique({
        where: {
          sellerId_dayOfWeek: {
            sellerId: service.seller.id,
            dayOfWeek
          }
        }
      });

      if (availability && availability.isAvailable) {
        // Check if seller is not on time off
        const timeOff = await prisma.sellerTimeOff.findFirst({
          where: {
            sellerId: service.seller.id,
            isActive: true,
            startDate: { lte: currentDate },
            endDate: { gte: currentDate }
          }
        });

        if (!timeOff) {
          // Try to find an available slot during this day
          const [startHour, startMinute] = availability.startTime.split(':').map(Number);
          const [endHour, endMinute] = availability.endTime.split(':').map(Number);

          let slotStart = new Date(currentDate);
          slotStart.setHours(startHour, startMinute, 0, 0);

          const dayEnd = new Date(currentDate);
          dayEnd.setHours(endHour, endMinute, 0, 0);

          // Skip to current time if it's today
          const now = new Date();
          if (currentDate.toDateString() === now.toDateString() && slotStart < now) {
            slotStart = new Date(now);
            slotStart.setMinutes(Math.ceil(slotStart.getMinutes() / 30) * 30); // Round to next 30-minute slot
          }

          while (slotStart < dayEnd) {
            const slotEnd = new Date(slotStart.getTime() + service.durationMinutes * 60000);

            if (slotEnd <= dayEnd) {
              const availability = await this.isSellerAvailable(
                service.seller.id,
                currentDate,
                slotStart,
                slotEnd
              );

              if (availability.available) {
                return {
                  date: currentDate,
                  startTime: slotStart,
                  endTime: slotEnd
                };
              }
            }

            // Move to next 30-minute slot
            slotStart = new Date(slotStart.getTime() + 30 * 60000);
          }
        }
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return null; // No available slot found
  }
} 