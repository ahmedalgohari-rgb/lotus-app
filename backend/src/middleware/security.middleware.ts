import helmet from 'helmet';
import cors from 'cors';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// Security headers configuration
export const securityHeaders = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: [
        "'self'", 
        "'unsafe-inline'", // Allow inline styles for React
        "https://fonts.googleapis.com",
        "https://cdn.jsdelivr.net"
      ],
      scriptSrc: [
        "'self'",
        "https://apis.google.com", // Google OAuth
        "https://appleid.cdn-apple.com" // Apple Sign-In
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",
        "https://fonts.googleapis.com"
      ],
      imgSrc: [
        "'self'",
        "data:", // For base64 images
        "https:", // Allow HTTPS images
        "blob:" // For uploaded images
      ],
      connectSrc: [
        "'self'",
        "https://api.plantnet.org", // PlantNet API
        "https://api.openweathermap.org", // Weather API
        "https://accounts.google.com", // Google OAuth
        "https://appleid.apple.com", // Apple OAuth
        "https://*.supabase.co" // Supabase
      ],
      frameSrc: [
        "https://accounts.google.com", // Google OAuth
        "https://appleid.apple.com" // Apple OAuth
      ],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },

  // Cross-Origin Embedder Policy
  crossOriginEmbedderPolicy: false, // Disabled for external APIs

  // DNS Prefetch Control
  dnsPrefetchControl: {
    allow: false
  },

  // Frame Options
  frameguard: {
    action: 'deny'
  },

  // Hide Powered-By header
  hidePoweredBy: true,

  // HTTP Strict Transport Security
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },

  // IE No Open
  ieNoOpen: true,

  // No Sniff
  noSniff: true,

  // Origin Agent Cluster
  originAgentCluster: true,

  // Permitted Cross-Domain Policies
  permittedCrossDomainPolicies: false,

  // Referrer Policy
  referrerPolicy: {
    policy: 'no-referrer'
  },

  // X-XSS-Protection
  xssFilter: true
});

// CORS configuration
export const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000', // Frontend development
      'http://localhost:3001', // Alt frontend port
      'http://localhost:8081', // Expo development
      'http://localhost:19006', // Expo web
      'https://lotus-plant-care.app', // Production domain (example)
      'https://app.lotus-plant-care.com', // Production subdomain (example)
      'capacitor://localhost', // Capacitor apps
      'ionic://localhost', // Ionic apps
      'file://', // Mobile apps
    ];

    // Allow all localhost variants in development
    if (process.env.NODE_ENV === 'development') {
      if (origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('192.168.')) {
        return callback(null, true);
      }
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn({
        message: 'CORS blocked origin',
        origin,
        timestamp: new Date().toISOString()
      });
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true, // Allow cookies and auth headers
  optionsSuccessStatus: 200, // For legacy browser support
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-Request-ID',
    'X-Client-Version',
    'User-Agent'
  ],
  exposedHeaders: [
    'X-Request-ID',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset'
  ]
};

// Security middleware for API endpoints
export const apiSecurity = (req: Request, res: Response, next: NextFunction) => {
  // Add custom security headers
  res.setHeader('X-API-Version', '1.0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 
    'geolocation=(), microphone=(), camera=(self), payment=(), usb=()');

  // Prevent caching of sensitive endpoints
  if (req.path.includes('/auth') || req.path.includes('/admin')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
  }

  // Add security logging for suspicious requests
  const suspiciousPatterns = [
    /\.\./,           // Directory traversal
    /<script/i,       // XSS attempts
    /union.*select/i, // SQL injection
    /javascript:/i,   // JavaScript injection
    /%3Cscript/i     // URL encoded script tags
  ];

  const url = req.url;
  const userAgent = req.get('User-Agent') || '';
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(url) || pattern.test(userAgent)) {
      logger.warn({
        message: 'Suspicious request detected',
        url,
        userAgent,
        ip: req.ip,
        method: req.method,
        headers: req.headers,
        pattern: pattern.toString()
      });
      break;
    }
  }

  next();
};

// File upload security
export const uploadSecurity = (req: Request, res: Response, next: NextFunction) => {
  // Additional headers for file upload endpoints
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'none'");
  
  // Log file upload attempts
  if (req.file || req.files) {
    logger.info({
      message: 'File upload detected',
      filename: req.file?.originalname || 'multiple files',
      size: req.file?.size,
      mimetype: req.file?.mimetype,
      userId: (req as any).user?.id,
      ip: req.ip
    });
  }

  next();
};

// Request sanitization
export const sanitizeRequest = (req: Request, res: Response, next: NextFunction) => {
  // Remove null bytes from all string inputs
  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      return obj.replace(/\0/g, ''); // Remove null bytes
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value);
      }
      return sanitized;
    }
    return obj;
  };

  // Sanitize request body, query, and params
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
};

// Content type validation
export const validateContentType = (allowedTypes: string[] = ['application/json']) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip validation for GET requests and file uploads
    if (req.method === 'GET' || req.is('multipart/form-data')) {
      return next();
    }

    const contentType = req.get('Content-Type');
    
    if (!contentType) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_CONTENT_TYPE',
          message: 'Content-Type header is required'
        }
      });
    }

    const isAllowed = allowedTypes.some(type => contentType.includes(type));
    
    if (!isAllowed) {
      logger.warn({
        message: 'Invalid content type',
        contentType,
        allowedTypes,
        url: req.url,
        method: req.method,
        ip: req.ip
      });

      return res.status(415).json({
        success: false,
        error: {
          code: 'INVALID_CONTENT_TYPE',
          message: `Content-Type must be one of: ${allowedTypes.join(', ')}`
        }
      });
    }

    next();
  };
};