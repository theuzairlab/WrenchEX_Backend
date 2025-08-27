import { Request, Response, NextFunction } from 'express';

// Performance metrics storage
const metrics = {
  requests: new Map<string, { count: number; totalTime: number; averageTime: number }>(),
  slowQueries: [] as Array<{ endpoint: string; duration: number; timestamp: Date }>,
  errorCount: 0,
  totalRequests: 0
};

export const performanceMonitoring = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const endpoint = `${req.method} ${req.route?.path || req.path}`;

  // Increment total requests
  metrics.totalRequests++;

  // Override end method to capture response time
  const originalEnd = res.end.bind(res);
  
  res.end = function(...args: any[]) {
    const duration = Date.now() - startTime;
    
    // Track endpoint metrics
    const endpointStats = metrics.requests.get(endpoint) || { count: 0, totalTime: 0, averageTime: 0 };
    endpointStats.count++;
    endpointStats.totalTime += duration;
    endpointStats.averageTime = endpointStats.totalTime / endpointStats.count;
    metrics.requests.set(endpoint, endpointStats);

    // Track slow queries (>1000ms)
    if (duration > 1000) {
      metrics.slowQueries.push({
        endpoint,
        duration,
        timestamp: new Date()
      });

      // Keep only last 100 slow queries
      if (metrics.slowQueries.length > 100) {
        metrics.slowQueries.shift();
      }
    }

    // Track errors
    if (res.statusCode >= 400) {
      metrics.errorCount++;
    }

    // Log slow requests
    if (duration > 500) {
      console.warn(`⚠️  Slow request: ${endpoint} took ${duration}ms`);
    }

    // Set performance headers
    res.setHeader('X-Response-Time', `${duration}ms`);
    
    return originalEnd(...args);
  };

  next();
};

export const getPerformanceMetrics = () => {
  const endpointMetrics = Array.from(metrics.requests.entries()).map(([endpoint, stats]) => ({
    endpoint,
    ...stats
  }));

  return {
    totalRequests: metrics.totalRequests,
    errorCount: metrics.errorCount,
    errorRate: metrics.totalRequests > 0 ? (metrics.errorCount / metrics.totalRequests) * 100 : 0,
    endpointMetrics: endpointMetrics.sort((a, b) => b.averageTime - a.averageTime),
    slowQueries: metrics.slowQueries.slice(-20), // Last 20 slow queries
    slowestEndpoints: endpointMetrics
      .filter(metric => metric.averageTime > 100)
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, 10)
  };
};

export const resetPerformanceMetrics = () => {
  metrics.requests.clear();
  metrics.slowQueries.length = 0;
  metrics.errorCount = 0;
  metrics.totalRequests = 0;
}; 