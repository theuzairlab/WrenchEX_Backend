import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

// User registration validation
export const registerValidation = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string()
    .min(8)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\\$%\\^&\\*])'))
    .required()
    .messages({
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    }),
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  phone: Joi.string().pattern(/^[\+]?[\d\s\-\(\)]+$/).optional(),
  role: Joi.string().valid('BUYER', 'SELLER', 'ADMIN').default('BUYER'),
  
  // Seller-specific fields (only required when role is SELLER)
  shopName: Joi.when('role', {
    is: 'SELLER',
    then: Joi.string().min(2).max(100).required(),
    otherwise: Joi.forbidden()
  }),
  shopAddress: Joi.when('role', {
    is: 'SELLER', 
    then: Joi.string().min(10).max(200).required(),
    otherwise: Joi.forbidden()
  }),
  businessType: Joi.when('role', {
    is: 'SELLER',
    then: Joi.string().min(2).max(50).required(),
    otherwise: Joi.forbidden()
  }),
  description: Joi.when('role', {
    is: 'SELLER',
    then: Joi.string().max(1000).optional(),
    otherwise: Joi.forbidden()
  })
});

// User login validation
export const loginValidation = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// Seller registration validation
export const sellerRegistrationValidation = Joi.object({
  shopName: Joi.string().min(2).max(100).required(),
  shopDescription: Joi.string().max(500).optional(),
  shopAddress: Joi.string().min(10).max(200).required(),
  city: Joi.string().min(2).max(50).required(),
  area: Joi.string().min(2).max(50).required(),
  latitude: Joi.number().min(-90).max(90).optional(),
  longitude: Joi.number().min(-180).max(180).optional()
});

// Seller profile update validation (all fields optional)
export const sellerProfileUpdateValidation = Joi.object({
  shopName: Joi.string().min(2).max(100).optional(),
  shopDescription: Joi.string().max(500).optional(),
  shopAddress: Joi.string().min(10).max(200).optional(),
  city: Joi.string().min(2).max(50).optional(),
  area: Joi.string().min(2).max(50).optional(),
  latitude: Joi.number().min(-90).max(90).optional(),
  longitude: Joi.number().min(-180).max(180).optional(),
  phone: Joi.string().pattern(/^[\+]?[\d\s\-\(\)]+$/).optional(),
  email: Joi.string().email().optional(),
  firstName: Joi.string().min(2).max(50).optional(),
  lastName: Joi.string().min(2).max(50).optional()
});

// Product validation
export const productValidation = Joi.object({
  title: Joi.string().min(3).max(100).required(),
  description: Joi.string().min(10).max(1000).required(),
  specifications: Joi.object().optional(),
  price: Joi.number().min(0).required(),
  categoryId: Joi.string().required(),
  images: Joi.array().items(Joi.string().uri()).max(10).optional()
});

// Service validation
export const serviceValidation = Joi.object({
  title: Joi.string().min(3).max(100).required(),
  description: Joi.string().min(10).max(1000).required(),
  price: Joi.number().min(0).required(),
  durationMinutes: Joi.number().integer().min(15).max(480).required(), // 15 min to 8 hours
  categoryId: Joi.string().required(),
  images: Joi.array().items(Joi.string().uri()).max(5).optional(),
  isAvailableForBooking: Joi.boolean().default(true)
});

// Category validation
export const categoryValidation = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  description: Joi.string().max(200).optional(),
  parentId: Joi.string().optional(),
  imageUrl: Joi.string().uri().optional()
});

// Pagination validation
export const paginationValidation = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().max(100).optional()
});

// Upload validation
// Cart validation
export const addToCartValidation = Joi.object({
  productId: Joi.string().required(),
  quantity: Joi.number().integer().min(1).required()
});

export const updateCartValidation = Joi.object({
  quantity: Joi.number().integer().min(1).required()
});

// Order validation
export const createOrderValidation = Joi.object({
  items: Joi.array().items(
    Joi.object({
      productId: Joi.string().required(),
      quantity: Joi.number().integer().min(1).required()
    })
  ).min(1).required(),
  deliveryAddress: Joi.object({
    street: Joi.string().min(10).max(200).required(),
    city: Joi.string().min(2).max(50).required(),
    area: Joi.string().min(2).max(50).required(),
    postalCode: Joi.string().optional(),
    phone: Joi.string().pattern(/^[0-9+\-\s()]+$/).required(),
    recipientName: Joi.string().min(2).max(100).required()
  }).required(),
  paymentMethod: Joi.string().valid('COD', 'DIGITAL_PAYMENT').required(),
  notes: Joi.string().max(500).optional()
});

export const createOrderFromCartValidation = Joi.object({
  deliveryAddress: Joi.object({
    street: Joi.string().min(10).max(200).required(),
    city: Joi.string().min(2).max(50).required(),
    area: Joi.string().min(2).max(50).required(),
    postalCode: Joi.string().optional(),
    phone: Joi.string().pattern(/^[0-9+\-\s()]+$/).required(),
    recipientName: Joi.string().min(2).max(100).required()
  }).required(),
  paymentMethod: Joi.string().valid('COD', 'DIGITAL_PAYMENT').required(),
  notes: Joi.string().max(500).optional()
});

export const updateOrderStatusValidation = Joi.object({
  status: Joi.string().valid('PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED').required(),
  notes: Joi.string().max(500).optional()
});

// Message validation
export const sendMessageValidation = Joi.object({
  message: Joi.string().min(1).max(1000).required()
});

// Service validation (different from existing serviceValidation for appointments)
export const createServiceValidation = Joi.object({
  title: Joi.string().min(3).max(100).required(),
  description: Joi.string().min(10).max(1000).required(),
  categoryId: Joi.string().required(),
  price: Joi.number().min(0).required(),
  durationMinutes: Joi.number().integer().min(15).max(480).required(), // 15 minutes to 8 hours
  isMobileService: Joi.boolean().required(),
  images: Joi.array().items(Joi.string().uri()).max(10).optional()
});

// Appointment validation
export const appointmentValidation = Joi.object({
  serviceId: Joi.string().required(),
  scheduledDate: Joi.date().min('now').required(),
  scheduledTimeStart: Joi.date().required(),
  scheduledTimeEnd: Joi.date().required(),
  serviceLocation: Joi.object({
    address: Joi.string().min(10).max(200).required(),
    latitude: Joi.number().min(-90).max(90).optional(),
    longitude: Joi.number().min(-180).max(180).optional(),
    type: Joi.string().valid('IN_SHOP', 'MOBILE', 'CUSTOMER_LOCATION').required()
  }).optional(),
  notes: Joi.string().max(500).optional()
}).custom((value, helpers) => {
  // Validate that end time is after start time
  if (value.scheduledTimeEnd <= value.scheduledTimeStart) {
    return helpers.error('custom.invalidTimeRange');
  }
  return value;
}).messages({
  'custom.invalidTimeRange': 'End time must be after start time'
});

export const updateAppointmentStatusValidation = Joi.object({
  status: Joi.string().valid('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED').required(),
  notes: Joi.string().max(500).optional()
});

// Seller availability validation
export const sellerAvailabilityValidation = Joi.object({
  dayOfWeek: Joi.number().integer().min(0).max(6).required(), // 0 = Sunday, 6 = Saturday
  startTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(), // HH:MM format
  endTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
  isAvailable: Joi.boolean().required()
}).custom((value, helpers) => {
  // Validate that end time is after start time
  if (value.endTime <= value.startTime) {
    return helpers.error('custom.invalidTimeRange');
  }
  return value;
}).messages({
  'custom.invalidTimeRange': 'End time must be after start time'
});

export const sellerTimeOffValidation = Joi.object({
  startDate: Joi.date().min('now').required(),
  endDate: Joi.date().required(),
  reason: Joi.string().max(200).optional()
}).custom((value, helpers) => {
  // Validate that end date is after start date
  if (value.endDate <= value.startDate) {
    return helpers.error('custom.invalidDateRange');
  }
  return value;
}).messages({
  'custom.invalidDateRange': 'End date must be after start date'
});

// Service search validation
export const serviceSearchValidation = Joi.object({
  categoryId: Joi.string().optional(),
  city: Joi.string().min(2).max(50).optional(),
  area: Joi.string().min(2).max(50).optional(),
  isMobileService: Joi.boolean().optional(),
  minPrice: Joi.number().min(0).optional(),
  maxPrice: Joi.number().min(0).optional(),
  search: Joi.string().min(2).max(100).optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(50).optional()
}).custom((value, helpers) => {
  // Validate price range
  if (value.minPrice && value.maxPrice && value.minPrice > value.maxPrice) {
    return helpers.error('custom.invalidPriceRange');
  }
  return value;
}).messages({
  'custom.invalidPriceRange': 'Minimum price cannot be greater than maximum price'
});

// Admin validation schemas
export const adminSellerApprovalValidation = Joi.object({
  isApproved: Joi.boolean().required(),
  notes: Joi.string().max(500).optional()
});

export const adminUserStatusValidation = Joi.object({
  action: Joi.string().valid('suspend', 'unsuspend').required(),
  reason: Joi.string().min(10).max(500).required()
});

export const adminUserSearchValidation = Joi.object({
  role: Joi.string().valid('ADMIN', 'SELLER', 'BUYER').optional(),
  isVerified: Joi.boolean().optional(),
  search: Joi.string().min(2).max(100).optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional()
});

export const adminOrderSearchValidation = Joi.object({
  status: Joi.string().valid('PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED').optional(),
  sellerId: Joi.string().optional(),
  buyerId: Joi.string().optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional()
});

export const adminAppointmentSearchValidation = Joi.object({
  status: Joi.string().valid('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED').optional(),
  sellerId: Joi.string().optional(),
  buyerId: Joi.string().optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional()
});

export const adminAnalyticsValidation = Joi.object({
  period: Joi.string().valid('today', 'week', 'month', 'year').optional()
});

export const uploadValidation = Joi.object({
  file: Joi.string().required(), // base64 string
  fileName: Joi.string().required(),
  folder: Joi.string().optional(),
  tags: Joi.array().items(Joi.string()).optional()
});

// Generic validation function
export const validateRequest = (schema: Joi.ObjectSchema, data: any) => {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    const errorMessage = error.details.map(detail => detail.message).join(', ');
    throw new Error(errorMessage);
  }

  return value;
};

// Middleware for request validation
export const validate = (schema: Joi.ObjectSchema, property: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const dataToValidate = req[property];
      const validatedData = validateRequest(schema, dataToValidate);
      
      // Replace the request property with validated data
      (req as any)[property] = validatedData;
      
      next();
    } catch (error) {
      res.status(400).json({
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Validation failed'
        }
      });
    }
  };
}; 