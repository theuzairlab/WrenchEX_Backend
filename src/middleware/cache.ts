import { Request, Response, NextFunction } from 'express';

// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

export const createCacheMiddleware = (ttlMinutes: number = 5) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const key = `${req.originalUrl || req.url}`;
    const cachedData = cache.get(key);

    // Check if cache exists and is still valid
    if (cachedData && Date.now() - cachedData.timestamp < cachedData.ttl) {
      console.log(`Cache hit for: ${key}`);
      return res.json(cachedData.data);
    }

    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to cache the response
    res.json = function(data: any) {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(key, {
          data,
          timestamp: Date.now(),
          ttl: ttlMinutes * 60 * 1000 // Convert to milliseconds
        });
        console.log(`Cache set for: ${key}`);
      }
      
      return originalJson(data);
    };

    next();
  };
};

export const clearCache = (pattern?: string) => {
  if (pattern) {
    // Clear cache entries matching pattern
    for (const [key] of cache) {
      if (key.includes(pattern)) {
        cache.delete(key);
      }
    }
  } else {
    // Clear all cache
    cache.clear();
  }
};

export const getCacheStats = () => {
  return {
    size: cache.size,
    entries: Array.from(cache.keys())
  };
}; 