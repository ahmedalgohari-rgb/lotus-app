import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import slowDown from 'express-slow-down';
import { Request, Response } from 'express';
import { logger } from '../utils/logger';

// Custom key generator for rate limiting (includes IP and User-Agent)
const generateKey = (req: Request): string => {
  const ip = req.ip || 'unknown';
  const userAgent = req.get('User-Agent') || 'unknown';
  // Create a hash-like key from IP and partial User-Agent
  const userAgentHash = Buffer.from(userAgent.substring(0, 50)).toString('base64').substring(0, 10);
  return `${ip}:${userAgentHash}`;
};

// Rate limit handler for logging
const rateLimitHandler = (req: Request, res: Response) => {
  const key = generateKey(req);
  
  logger.warn({
    message: 'Rate limit exceeded',
    key,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  res.status(429).json({
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please try again later.',
      retryAfter: res.getHeader('Retry-After')
    }
  });
};

// Strict rate limiting for authentication endpoints
export const authRateLimit: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each key to 5 requests per windowMs
  keyGenerator: generateKey,
  handler: rateLimitHandler,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    success: false,
    error: {
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts. Please try again in 15 minutes.'
    }
  }
});

// More restrictive rate limiting for password reset
export const passwordResetRateLimit: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit to 3 password reset attempts per hour
  keyGenerator: generateKey,
  handler: rateLimitHandler,
  message: {
    success: false,
    error: {
      code: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED',
      message: 'Too many password reset attempts. Please try again in 1 hour.'
    }
  }
});

// Rate limiting for API endpoints
export const apiRateLimit: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each key to 100 requests per windowMs
  keyGenerator: generateKey,
  handler: rateLimitHandler,
  message: {
    success: false,
    error: {
      code: 'API_RATE_LIMIT_EXCEEDED',
      message: 'Too many API requests. Please try again later.'
    }
  }
});

// Rate limiting for file uploads
export const uploadRateLimit: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // Limit to 50 uploads per hour
  keyGenerator: generateKey,
  handler: rateLimitHandler,
  message: {
    success: false,
    error: {
      code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
      message: 'Too many file uploads. Please try again later.'
    }
  }
});

// Slow down repeated requests progressively
export const authSlowDown = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 2, // Allow 2 requests per window at full speed
  delayMs: 500, // Add 500ms delay per request after delayAfter
  maxDelayMs: 20000, // Maximum delay of 20 seconds
  keyGenerator: generateKey
}) as any;

// Rate limiting for registration (stricter than login)
export const registrationRateLimit: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit to 3 registration attempts per hour
  keyGenerator: generateKey,
  handler: rateLimitHandler,
  message: {
    success: false,
    error: {
      code: 'REGISTRATION_RATE_LIMIT_EXCEEDED',
      message: 'Too many registration attempts. Please try again in 1 hour.'
    }
  }
});

// Global rate limiting (very high limit, for DDoS protection)
export const globalRateLimit: RateLimitRequestHandler = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 1000, // Very high limit for DDoS protection
  keyGenerator: generateKey,
  handler: rateLimitHandler,
  message: {
    success: false,
    error: {
      code: 'GLOBAL_RATE_LIMIT_EXCEEDED',
      message: 'Server is experiencing high traffic. Please try again later.'
    }
  }
});

// Email-based rate limiting for forgot password
export const emailRateLimit = (maxAttempts: number = 5, windowMs: number = 60 * 60 * 1000) => {
  return rateLimit({
    windowMs,
    max: maxAttempts,
    keyGenerator: (req: Request) => {
      // Use email from body for email-based limiting
      const email = req.body?.email || req.query?.email || 'unknown';
      return `email:${email.toLowerCase()}`;
    },
    handler: rateLimitHandler,
    message: {
      success: false,
      error: {
        code: 'EMAIL_RATE_LIMIT_EXCEEDED',
        message: 'Too many requests for this email address. Please try again later.'
      }
    }
  });
};

// User-based rate limiting (after authentication)
export const userRateLimit = (maxAttempts: number = 200, windowMs: number = 15 * 60 * 1000) => {
  return rateLimit({
    windowMs,
    max: maxAttempts,
    keyGenerator: (req: Request) => {
      // Use user ID from auth middleware
      const userId = (req as any).user?.id || generateKey(req);
      return `user:${userId}`;
    },
    handler: rateLimitHandler,
    message: {
      success: false,
      error: {
        code: 'USER_RATE_LIMIT_EXCEEDED',
        message: 'Too many requests from your account. Please try again later.'
      }
    }
  });
};