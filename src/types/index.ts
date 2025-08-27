export enum UserRole {
  ADMIN = 'ADMIN',
  SELLER = 'SELLER',
  BUYER = 'BUYER'
}

export enum AppointmentStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  PRICE_OFFER = 'PRICE_OFFER'
}

export enum PaymentMethod {
  COD = 'COD',
  DIGITAL_PAYMENT = 'DIGITAL_PAYMENT'
}

// Product Chat related types
export interface ProductChat {
  id: string;
  productId: string;
  buyerId: string;
  sellerId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  product: {
    id: string;
    title: string;
    price: number;
    images?: any;
  };
  buyer: {
    id: string;
    firstName: string;
    lastName: string;
  };
  seller: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  messages: ProductMessage[];
  unreadCount?: number;
}

export interface ProductMessage {
  id: string;
  chatId: string;
  senderId: string;
  message: string;
  messageType: MessageType;
  isRead: boolean;
  createdAt: Date;
  sender: {
    firstName: string;
    lastName: string;
  };
}

export interface StartChatData {
  productId: string;
  message: string;
}

export interface SendMessageData {
  chatId: string;
  message: string;
  messageType?: MessageType;
}

export interface SellerChatSettings {
  id: string;
  sellerId: string;
  showPhone: boolean;
  autoReplyText?: string;
  isOnline: boolean;
  lastSeen?: Date;
}

// Appointment related types (KEEP - unchanged)
export interface AppointmentCreateData {
  serviceId: string;
  scheduledDate: Date;
  scheduledTimeStart: Date;
  scheduledTimeEnd: Date;
  serviceLocation?: {
    address: string;
    latitude?: number;
    longitude?: number;
    type: 'IN_SHOP' | 'MOBILE' | 'CUSTOMER_LOCATION';
  };
  notes?: string;
}

export interface AppointmentDetails {
  id: string;
  appointmentNumber: string;
  status: AppointmentStatus;
  scheduledDate: Date;
  scheduledTimeStart: Date;
  scheduledTimeEnd: Date;
  totalAmount: number;
  serviceLocation?: any;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  buyerId: string;
  sellerId: string;
  buyer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  seller: {
    id: string;
    userId: string;
    shopName: string;
    shopAddress: string;
    city: string;
    area: string;
  };
  service: {
    id: string;
    title: string;
    description: string;
    price: number;
    durationMinutes: number;
    isMobileService: boolean;
    images?: any;
  };
  statusHistory: AppointmentStatusHistoryItem[];
  messages: AppointmentMessage[];
}

export interface AppointmentStatusHistoryItem {
  id: string;
  status: AppointmentStatus;
  notes?: string;
  changedBy: string;
  changedAt: Date;
  changedByUser: {
    firstName: string;
    lastName: string;
  };
}

export interface AppointmentMessage {
  id: string;
  appointmentId: string;
  senderId: string;
  receiverId: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  sender: {
    firstName: string;
    lastName: string;
  };
}

export interface AppointmentFilters {
  status?: AppointmentStatus;
  sellerId?: string;
  buyerId?: string;
  serviceId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export interface SellerAvailability {
  id: string;
  sellerId: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  startTime: string; // "HH:MM" format
  endTime: string;   // "HH:MM" format
  isAvailable: boolean;
}

export interface SellerTimeOff {
  id: string;
  sellerId: string;
  startDate: Date;
  endDate: Date;
  reason?: string;
  isActive: boolean;
}

export interface ServiceDetails {
  id: string;
  title: string;
  description: string;
  price: number;
  durationMinutes: number;
  isMobileService: boolean;
  images?: any;
  isActive: boolean;
  ratingAverage?: number;
  ratingCount: number;
  createdAt: Date;
  updatedAt: Date;
  seller: {
    shopName: string;
    shopAddress: string;
    city: string;
    area: string;
    ratingAverage?: number;
  };
  category: {
    name: string;
    description?: string;
  };
}

export interface ServiceFilters {
  categoryId?: string;
  sellerId?: string;
  city?: string;
  area?: string;
  isMobileService?: boolean;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  page?: number;
  limit?: number;
  includeInactive?: boolean;
}

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    details?: any;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface ProductFilters extends PaginationQuery {
  category?: string;
  seller?: string;
  sellerId?: string;
  city?: string;
  area?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  status?: string;
  includeInactive?: boolean;
}

// Chat Analytics Types
export interface ChatAnalytics {
  totalChats: number;
  activeChats: number;
  responseTime: number; // in minutes
  messagesSent: number;
  messagesReceived: number;
}

export interface SellerChatPerformance {
  sellerId: string;
  averageResponseTime: number;
  totalChats: number;
  activeChats: number;
  chatInitiations: number;
  lastMonthComparison: {
    chats: number;
    responseTime: number;
  };
}