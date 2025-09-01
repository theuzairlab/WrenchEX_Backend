# 🚀 WrenchEX Backend API

A robust, scalable backend API for the WrenchEX automotive marketplace platform. Built with Node.js, Express, TypeScript, and PostgreSQL.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Authentication & Authorization](#authentication--authorization)
- [WebSocket Integration](#websocket-integration)
- [Performance & Monitoring](#performance--monitoring)
- [Security Features](#security-features)
- [Development Guidelines](#development-guidelines)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

WrenchEX Backend is a comprehensive marketplace API that handles:
- **User Management**: Authentication, authorization, and user profiles
- **Seller Management**: Shop profiles, approval workflows, and business operations
- **Product & Service Management**: Automotive parts, services, and categories
- **Appointment System**: Booking, scheduling, and status management
- **Real-time Chat**: WebSocket-based communication between buyers and sellers
- **Admin Panel**: Platform administration and moderation tools
- **File Management**: Image uploads and media handling

## 🏗️ Architecture

### **Layered Architecture Pattern**
```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                       │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐  │
│  │   Routes    │ │ Middleware  │ │   WebSocket Hub     │  │
│  └─────────────┘ └─────────────┘ └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                    Business Logic Layer                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐  │
│  │ Controllers │ │  Services   │ │   Validators        │  │
│  └─────────────┘ └─────────────┘ └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                    Data Access Layer                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐  │
│  │   Prisma    │ │   Cache     │ │   File Storage      │  │
│  └─────────────┘ └─────────────┘ └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                    Infrastructure Layer                      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐  │
│  │ PostgreSQL  │ │   Redis     │ │   ImageKit          │  │
│  └─────────────┘ └─────────────┘ └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### **Directory Structure**
```
backend/
├── src/
│   ├── app.ts                 # Main application entry point
│   ├── config/                # Configuration files
│   │   ├── database.ts        # Database configuration
│   │   └── imagekit.ts        # ImageKit configuration
│   ├── controllers/           # Request handlers
│   ├── middleware/            # Custom middleware
│   ├── routes/                # API route definitions
│   ├── services/              # Business logic
│   ├── types/                 # TypeScript type definitions
│   ├── utils/                 # Utility functions
│   └── websocket/             # WebSocket handlers
├── prisma/                    # Database schema and migrations
├── dist/                      # Compiled JavaScript output
└── package.json               # Dependencies and scripts
```

## 🛠️ Tech Stack

### **Core Technologies**
- **Runtime**: Node.js 18+
- **Framework**: Express.js 5.x
- **Language**: TypeScript 5.x
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT + Google OAuth

### **Key Dependencies**
- **Security**: Helmet, CORS, Rate Limiting
- **Validation**: Joi, Express Validator
- **File Upload**: ImageKit integration
- **Real-time**: Socket.io for WebSocket
- **Performance**: Caching middleware, monitoring
- **Development**: Nodemon, TypeScript compiler

## 🚀 Getting Started

### **Prerequisites**
- Node.js 18+ 
- PostgreSQL 12+
- npm or yarn package manager

### **Environment Setup**
Create a `.env` file in the backend root:

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/wrenchex_db"

# JWT Secret
JWT_SECRET="your-super-secret-jwt-key"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# ImageKit
IMAGEKIT_PUBLIC_KEY="your-imagekit-public-key"
IMAGEKIT_PRIVATE_KEY="your-imagekit-private-key"
IMAGEKIT_URL_ENDPOINT="your-imagekit-url-endpoint"

# Server
PORT=5000
NODE_ENV=development
```

### **Installation & Setup**

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Seed database (optional)
npm run db:seed

# Build TypeScript
npm run build

# Start development server
npm run dev

# Start production server
npm start
```

### **Database Setup**
```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Open Prisma Studio (GUI)
npm run db:studio
```

## 📚 API Documentation

### **Base URL**
```
Development: http://localhost:5000/api
Production: https://your-domain.com/api
```

### **Health & Monitoring**
```http
GET /health          # Health check
GET /metrics         # Performance metrics
```

### **Authentication Routes** (`/api/auth`)
```http
POST /login          # User login
POST /register       # User registration
POST /google         # Google OAuth
POST /refresh        # Refresh JWT token
POST /logout         # User logout
```

### **User Management** (`/api/users`)
```http
GET    /             # Get user profile
PUT    /             # Update user profile
DELETE /             # Delete user account
GET    /:id          # Get user by ID
```

### **Seller Management** (`/api/sellers`)
```http
GET    /             # Get all sellers
POST   /             # Create seller profile
GET    /:id          # Get seller by ID
PUT    /:id          # Update seller profile
PUT    /:id/approval # Update approval status
```

### **Product Management** (`/api/products`)
```http
GET    /             # Get all products
POST   /             # Create product
GET    /:id          # Get product by ID
PUT    /:id          # Update product
DELETE /:id          # Delete product
GET    /search       # Search products
```

### **Service Management** (`/api/services`)
```http
GET    /             # Get all services
POST   /             # Create service
GET    /:id          # Get service by ID
PUT    /:id          # Update service
DELETE /:id          # Delete service
```

### **Category Management** (`/api/categories`)
```http
GET    /             # Get all categories
POST   /             # Create category
GET    /:id          # Get category by ID
PUT    /:id          # Update category
DELETE /:id          # Delete category
```

### **Appointment System** (`/api/appointments`)
```http
GET    /             # Get appointments
POST   /             # Create appointment
GET    /:id          # Get appointment by ID
PUT    /:id          # Update appointment
PUT    /:id/status   # Update appointment status
DELETE /:id          # Cancel appointment
```

### **Admin Panel** (`/api/admin`)
```http
GET    /stats        # Platform statistics
GET    /users        # User management
GET    /sellers      # Seller management
PUT    /sellers/:id/approval  # Seller approval
GET    /chats        # Chat moderation
DELETE /chats/:id    # Delete chat
GET    /appointments # Appointment overview
```

### **File Upload** (`/api/upload`)
```http
POST   /image        # Upload image
POST   /document     # Upload document
DELETE /:id          # Delete file
```

### **Real-time Chat** (`/api/chat`)
```http
GET    /             # Get chat history
POST   /             # Send message
GET    /:id          # Get specific chat
```

## 🗄️ Database Schema

### **Core Models**

#### **User Model**
```typescript
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String?
  role         UserRole @default(BUYER)
  firstName    String
  lastName     String
  phone        String?
  isVerified   Boolean  @default(false)
  googleId     String?  @unique
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  // Relations
  seller        Seller?
  appointments  Appointment[]
  reviews       Review[]
}
```

#### **Seller Model**
```typescript
model Seller {
  id                   String    @id @default(cuid())
  userId               String    @unique
  shopName             String
  shopDescription      String?
  shopAddress          String
  businessType         String?
  city                 String
  area                 String
  latitude             Float?
  longitude            Float?
  isApproved           Boolean   @default(false)
  subscriptionPlan     String?
  ratingAverage        Float?    @default(0)
  ratingCount          Int       @default(0)
  
  // Relations
  user         User
  products     Product[]
  services     Service[]
}
```

#### **Product Model**
```typescript
model Product {
  id          String   @id @default(cuid())
  name        String
  description String?
  price       Float
  categoryId  String
  sellerId    String
  isActive    Boolean  @default(true)
  isFlagged   Boolean  @default(false)
  images      String[]
  
  // Relations
  category    Category
  seller      Seller
  reviews     Review[]
}
```

### **Enums**
```typescript
enum UserRole {
  ADMIN
  SELLER
  BUYER
}

enum AppointmentStatus {
  PENDING
  CONFIRMED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum MessageType {
  TEXT
  IMAGE
  PRICE_OFFER
}
```

## 🔐 Authentication & Authorization

### **JWT Authentication**
- **Access Token**: Short-lived (15 minutes)
- **Refresh Token**: Long-lived (7 days)
- **Secure Storage**: HTTP-only cookies

### **Role-Based Access Control (RBAC)**
```typescript
enum UserRole {
  ADMIN    // Full platform access
  SELLER   // Shop management
  BUYER    // Marketplace access
}
```

### **Middleware Chain**
```typescript
// Authentication middleware
app.use('/api/protected', authenticate);

// Role-based authorization
app.use('/api/admin', authenticate, authorize(UserRole.ADMIN));
app.use('/api/sellers', authenticate, authorize([UserRole.SELLER, UserRole.ADMIN]));
```

## 💬 WebSocket Integration

### **Real-time Features**
- **Live Chat**: Buyer-seller communication
- **Appointment Updates**: Real-time status changes
- **Notifications**: Instant platform alerts

### **Socket Events**
```typescript
// Client to Server
'send_message'
'join_chat'
'leave_chat'
'typing_start'
'typing_stop'

// Server to Client
'message_received'
'user_joined'
'user_left'
'typing_indicator'
'appointment_update'
```

## 📊 Performance & Monitoring

### **Caching Strategy**
- **Product Routes**: 5-minute cache
- **Service Routes**: 5-minute cache  
- **Category Routes**: 10-minute cache
- **User Routes**: No cache (real-time)

### **Rate Limiting**
```typescript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300                   // 300 requests per window
});
```

### **Performance Metrics**
- **Response Time**: Request processing duration
- **Throughput**: Requests per second
- **Error Rate**: Failed request percentage
- **Cache Hit Rate**: Cache effectiveness

## 🛡️ Security Features

### **Security Headers**
- **Helmet**: Security middleware
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: DDoS protection
- **Input Validation**: XSS and injection prevention

### **Data Protection**
- **Password Hashing**: bcrypt with salt
- **JWT Security**: Secure token handling
- **SQL Injection**: Prisma ORM protection
- **File Upload**: Type and size validation

## 🧪 Development Guidelines

### **Code Style**
- **TypeScript**: Strict type checking
- **ESLint**: Code quality enforcement
- **Prettier**: Code formatting
- **Conventional Commits**: Git commit messages

### **Testing Strategy**
```bash
# Unit tests
npm run test:unit

# Integration tests  
npm run test:integration

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage
```

### **API Documentation**
- **OpenAPI/Swagger**: Interactive API docs
- **Postman Collection**: Import-ready API tests
- **JSDoc**: Inline code documentation

## 🚀 Deployment

### **Environment Variables**
```bash
# Production
NODE_ENV=production
PORT=5000
DATABASE_URL="postgresql://..."
JWT_SECRET="..."
```

### **Docker Deployment**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

### **PM2 Process Management**
```bash
# Start application
pm2 start ecosystem.config.js

# Monitor processes
pm2 monit

# View logs
pm2 logs
```

## 🔧 Troubleshooting

### **Common Issues**

#### **Database Connection**
```bash
# Check database status
npm run db:studio

# Reset database
npm run db:reset

# Check migrations
npm run db:migrate:status
```

#### **JWT Issues**
```bash
# Clear JWT secret
rm .env && recreate

# Check token expiration
jwt.decode(token)
```

#### **Performance Issues**
```bash
# Check metrics
GET /metrics

# Monitor cache
GET /cache/stats

# Check rate limiting
GET /rate-limit/status
```

### **Logs & Debugging**
```typescript
// Enable debug logging
DEBUG=app:*,prisma:*

// Performance monitoring
app.use(performanceMonitoring);

// Error tracking
app.use(errorHandler);
```

## 📞 Support & Contributing

### **Getting Help**
- **Issues**: GitHub Issues
- **Documentation**: This README
- **API Reference**: Postman Collection
- **Community**: Discord/Slack

### **Contributing**
1. Fork the repository
2. Create feature branch
3. Follow coding standards
4. Add tests
5. Submit pull request

### **Development Team**
- **Backend Lead**: [Your Name]
- **API Developer**: [Team Member]
- **DevOps**: [Infrastructure Team]

---

## 📝 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🔄 Version History

- **v1.0.0** - Initial release with core marketplace features
- **v1.1.0** - Added WebSocket chat system
- **v1.2.0** - Enhanced admin panel and analytics
- **v1.3.0** - Performance optimizations and caching

---

**Built with ❤️ by the WrenchEX Team**

*Last updated: ${new Date().toLocaleDateString()}*
