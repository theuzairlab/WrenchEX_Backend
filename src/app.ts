import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from 'dotenv';
import { createServer } from 'http';

// Load environment variables
config();

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { performanceMonitoring, getPerformanceMetrics } from './middleware/performance';
import { createCacheMiddleware, getCacheStats } from './middleware/cache';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import sellerRoutes from './routes/sellers';
import productRoutes from './routes/products';
import serviceRoutes from './routes/services';
import categoryRoutes from './routes/categories';
import appointmentRoutes from './routes/appointments';
import adminRoutes from './routes/admin';
import uploadRoutes from './routes/upload';
// import messageRoutes from './routes/messages'; // Temporarily disabled
import availabilityRoutes from './routes/availability';
import productChatRoutes from './routes/productChat';
import { ChatSocketManager } from './websocket/chatSocket';

const app = express();
const PORT = process.env.PORT || 5000;

// Create HTTP server for Socket.io
const httpServer = createServer(app);

// Security middleware
app.use(helmet());
app.use(cors());

// Performance monitoring
app.use(performanceMonitoring);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'WrenchEX API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Performance metrics endpoint
app.get('/metrics', (req, res) => {
  const performance = getPerformanceMetrics();
  const cache = getCacheStats();
  
  res.status(200).json({
    performance,
    cache,
    timestamp: new Date().toISOString()
  });
});

// API Routes with caching for read-heavy endpoints
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sellers', sellerRoutes);

// Cache product and service routes (5 minutes)
app.use('/api/products', createCacheMiddleware(5), productRoutes);
app.use('/api/services', createCacheMiddleware(5), serviceRoutes);
app.use('/api/categories', createCacheMiddleware(10), categoryRoutes); // Categories change less frequently

app.use('/api/appointments', appointmentRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
// app.use('/api/messages', messageRoutes); // Temporarily disabled
app.use('/api/chat', productChatRoutes); // New product chat system

// 404 handler for undefined routes
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Initialize WebSocket Chat Manager
const chatSocket = new ChatSocketManager(httpServer);

// Start server
httpServer.listen(PORT, () => {
  console.log(`🚀 WrenchEX API Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📈 Metrics: http://localhost:${PORT}/metrics`);
  console.log(`💬 WebSocket Chat Server ready`);
});

export default app; 