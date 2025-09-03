import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { performance } from 'perf_hooks';

// Request logging interface
interface RequestLog {
  requestId: string;
  method: string;
  url: string;
  ip: string;
  userAgent: string;
  userId?: string;
  statusCode?: number;
  responseTime?: number;
  contentLength?: number;
  error?: any;
  timestamp: string;
}

// Extend Request type to include timing
interface TimedRequest extends Request {
  startTime?: number;
  requestId?: string;
}

// Request logging middleware
export const requestLogger = (req: TimedRequest, res: Response, next: NextFunction) => {
  const startTime = performance.now();
  req.startTime = startTime;
  
  // Generate or use existing request ID
  const requestId = req.get('X-Request-ID') || 
    `lotus-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  req.requestId = requestId;
  
  // Set request ID in response header
  res.setHeader('X-Request-ID', requestId);

  // Basic request info
  const requestLog: Partial<RequestLog> = {
    requestId,
    method: req.method,
    url: req.url,
    ip: req.ip || 'unknown',
    userAgent: req.get('User-Agent') || 'unknown',
    timestamp: new Date().toISOString()
  };

  // Log sensitive endpoint access
  if (req.path.includes('/auth') || req.path.includes('/admin')) {
    logger.info({
      ...requestLog,
      message: 'Sensitive endpoint accessed',
      path: req.path
    });
  }

  // Hook into response finish to log completion
  const originalSend = res.send;
  res.send = function(body) {
    const endTime = performance.now();
    const responseTime = Math.round(endTime - startTime);
    
    const completeLog: RequestLog = {
      ...requestLog as RequestLog,
      statusCode: res.statusCode,
      responseTime,
      contentLength: Buffer.isBuffer(body) ? body.length : Buffer.byteLength(body || '', 'utf8'),
      userId: (req as any).user?.id
    };

    // Log based on status code
    if (res.statusCode >= 500) {
      logger.error({
        ...completeLog,
        message: 'Server error response'
      });
    } else if (res.statusCode >= 400) {
      logger.warn({
        ...completeLog,
        message: 'Client error response'
      });
    } else {
      logger.info({
        ...completeLog,
        message: 'Request completed'
      });
    }

    // Log slow requests
    if (responseTime > 5000) { // 5 seconds
      logger.warn({
        ...completeLog,
        message: 'Slow request detected',
        threshold: '5000ms'
      });
    }

    return originalSend.call(this, body);
  };

  next();
};

// Error logging middleware
export const errorLogger = (error: any, req: TimedRequest, res: Response, next: NextFunction) => {
  const endTime = performance.now();
  const responseTime = req.startTime ? Math.round(endTime - req.startTime) : 0;

  const errorLog = {
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: (req as any).user?.id,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code,
      statusCode: error.statusCode || 500
    },
    responseTime,
    timestamp: new Date().toISOString()
  };

  // Log error with appropriate level
  if (error.statusCode && error.statusCode < 500) {
    logger.warn({
      ...errorLog,
      message: 'Client error occurred'
    });
  } else {
    logger.error({
      ...errorLog,
      message: 'Server error occurred'
    });
  }

  next(error);
};

// Authentication attempt logging
export const authLogger = (req: Request, res: Response, next: NextFunction) => {
  const originalSend = res.send;
  
  res.send = function(body) {
    const isSuccess = res.statusCode < 400;
    const email = req.body?.email || 'unknown';
    const provider = req.body?.provider || 'email';
    
    const authLog = {
      requestId: req.get('X-Request-ID'),
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      email,
      provider,
      success: isSuccess,
      statusCode: res.statusCode,
      timestamp: new Date().toISOString()
    };

    if (isSuccess) {
      logger.info({
        ...authLog,
        message: 'Authentication successful'
      });
    } else {
      logger.warn({
        ...authLog,
        message: 'Authentication failed',
        attempt: 'failed'
      });
    }

    return originalSend.call(this, body);
  };

  next();
};

// Security event logging
export const securityLogger = {
  // Suspicious activity
  suspiciousActivity: (req: Request, reason: string, details?: any) => {
    logger.warn({
      message: 'Suspicious activity detected',
      reason,
      details,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url,
      method: req.method,
      userId: (req as any).user?.id,
      timestamp: new Date().toISOString(),
      severity: 'medium'
    });
  },

  // Failed authorization
  authorizationFailure: (req: Request, resource: string, action: string) => {
    logger.warn({
      message: 'Authorization failure',
      resource,
      action,
      userId: (req as any).user?.id,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url,
      timestamp: new Date().toISOString(),
      severity: 'high'
    });
  },

  // Data access logging
  dataAccess: (req: Request, resource: string, action: string) => {
    logger.info({
      message: 'Data access',
      resource,
      action,
      userId: (req as any).user?.id,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });
  },

  // Admin action logging
  adminAction: (req: Request, action: string, target?: string) => {
    logger.info({
      message: 'Admin action performed',
      action,
      target,
      adminUserId: (req as any).user?.id,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString(),
      severity: 'high'
    });
  }
};

// Performance monitoring
export const performanceMonitor = (req: TimedRequest, res: Response, next: NextFunction) => {
  const startTime = performance.now();
  req.startTime = startTime;

  const originalSend = res.send;
  res.send = function(body) {
    const endTime = performance.now();
    const responseTime = Math.round(endTime - startTime);
    
    // Log performance metrics
    const performanceLog = {
      requestId: req.requestId,
      method: req.method,
      url: req.url,
      responseTime,
      statusCode: res.statusCode,
      contentLength: Buffer.isBuffer(body) ? body.length : Buffer.byteLength(body || '', 'utf8'),
      timestamp: new Date().toISOString()
    };

    // Log performance issues
    if (responseTime > 10000) { // 10 seconds
      logger.error({
        ...performanceLog,
        message: 'Critical performance issue',
        severity: 'critical'
      });
    } else if (responseTime > 5000) { // 5 seconds
      logger.warn({
        ...performanceLog,
        message: 'Performance issue detected',
        severity: 'medium'
      });
    }

    return originalSend.call(this, body);
  };

  next();
};

// Audit logging for sensitive operations
export const auditLogger = {
  // User management actions
  userAction: (userId: string, action: string, details: any, performedBy?: string) => {
    logger.info({
      message: 'User action audit',
      userId,
      action,
      details,
      performedBy: performedBy || userId,
      timestamp: new Date().toISOString(),
      category: 'user_management'
    });
  },

  // Data modification actions
  dataModification: (userId: string, resource: string, action: string, resourceId: string, changes?: any) => {
    logger.info({
      message: 'Data modification audit',
      userId,
      resource,
      action,
      resourceId,
      changes,
      timestamp: new Date().toISOString(),
      category: 'data_modification'
    });
  },

  // Security events
  securityEvent: (event: string, details: any, severity: 'low' | 'medium' | 'high' | 'critical' = 'medium') => {
    logger.warn({
      message: 'Security event audit',
      event,
      details,
      severity,
      timestamp: new Date().toISOString(),
      category: 'security'
    });
  }
};