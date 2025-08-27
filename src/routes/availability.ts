import { Router } from 'express';
import { AvailabilityController } from '../controllers/availabilityController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../types';

const router = Router();

// Public routes for checking availability
router.get('/seller/:sellerId', AvailabilityController.getSellerAvailability);
router.get('/seller/:sellerId/check', AvailabilityController.checkAvailability);
router.get('/seller/:sellerId/calendar', AvailabilityController.getSellerCalendar);
router.get('/seller/:sellerId/timeoff', AvailabilityController.getTimeOff);
router.get('/service/:serviceId/next-slot', AvailabilityController.getNextAvailableSlot);

// Protected routes (authentication required)
router.use(authenticate);

// Seller availability management (sellers only)
router.post('/day', authorize(UserRole.SELLER), AvailabilityController.setDayAvailability);
router.post('/weekly', authorize(UserRole.SELLER), AvailabilityController.setWeeklyAvailability);

// Time off management (sellers only)
router.post('/timeoff', authorize(UserRole.SELLER), AvailabilityController.addTimeOff);
router.delete('/timeoff/:timeOffId', authorize(UserRole.SELLER), AvailabilityController.removeTimeOff);

// Get own availability/schedule (sellers only)
router.get('/my-schedule', authorize(UserRole.SELLER), AvailabilityController.getSellerAvailability);
router.get('/my-timeoff', authorize(UserRole.SELLER), AvailabilityController.getTimeOff);
router.get('/my-calendar', authorize(UserRole.SELLER), AvailabilityController.getSellerCalendar);

export default router; 