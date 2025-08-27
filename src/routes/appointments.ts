import { Router } from 'express';
import { AppointmentController } from '../controllers/appointmentController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../types';

const router = Router();

// All appointment routes require authentication
router.use(authenticate);

// Create new appointment (buyers only)
router.post('/', AppointmentController.createAppointment);

// Get all appointments with filters (role-based access)
router.get('/', AppointmentController.getAppointments);

// Get upcoming appointments for current user
router.get('/upcoming', AppointmentController.getUpcomingAppointments);

// Get appointment by ID
router.get('/:appointmentId', AppointmentController.getAppointmentById);

// Update appointment status (sellers and admin only)
router.put('/:appointmentId/status', AppointmentController.updateAppointmentStatus);

// Cancel appointment (all parties can cancel)
router.put('/:appointmentId/cancel', AppointmentController.cancelAppointment);

// Get available time slots for a service
router.get('/service/:serviceId/slots', AppointmentController.getAvailableTimeSlots);

// Get seller analytics (sellers only)
router.get('/analytics/seller', authorize(UserRole.SELLER), AppointmentController.getSellerAnalytics);

export default router; 