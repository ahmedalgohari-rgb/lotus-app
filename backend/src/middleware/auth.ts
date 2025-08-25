import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface JWTPayload {
  userId: string;
  deviceId: string;
  tokenId: string;
  type: 'access' | 'refresh';
  version: number;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    deviceId: string;
    tokenId: string;
  };
}

export class AuthenticationError extends Error {
  statusCode = 401;
  code = 'AUTHENTICATION_ERROR';
  
  constructor(message: string = 'Authentication failed') {
    super(message);
  }
}

export class AuthorizationError extends Error {
  statusCode = 403;
  code = 'AUTHORIZATION_ERROR';
  
  constructor(message: string = 'Access denied') {
    super(message);
  }
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Missing or invalid authorization header');
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      throw new AuthenticationError('No token provided');
    }
    
    // Verify JWT token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!,
      {
        issuer: 'lotus-app',
        audience: 'lotus-api',
      }
    ) as JWTPayload;
    
    // Validate token type
    if (decoded.type !== 'access') {
      throw new AuthenticationError('Invalid token type');
    }
    
    // Check token version (for token rotation/invalidation)
    if (decoded.version !== 1) {
      throw new AuthenticationError('Token version mismatch');
    }
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { 
        id: decoded.userId,
        deletedAt: null, // Ensure user is not soft-deleted
      },
      select: {
        id: true,
        email: true,
        role: true,
        isEmailVerified: true,
        lastLoginAt: true,
      },
    });
    
    if (!user) {
      throw new AuthenticationError('User not found');
    }
    
    // Check if email is verified (optional based on your requirements)
    if (!user.isEmailVerified) {
      throw new AuthenticationError('Email not verified');
    }
    
    // Check if refresh token still exists and is not revoked
    const refreshToken = await prisma.refreshToken.findFirst({
      where: {
        userId: decoded.userId,
        deviceId: decoded.deviceId,
        revokedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
    });
    
    if (!refreshToken) {
      throw new AuthenticationError('Session expired');
    }
    
    // Attach user info to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      deviceId: decoded.deviceId,
      tokenId: decoded.tokenId,
    };
    
    // Log successful authentication
    logger.info({
      message: 'User authenticated',
      userId: user.id,
      email: user.email,
      deviceId: decoded.deviceId,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
    
    next();
    
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      logger.warn({
        message: 'JWT verification failed',
        error: error.message,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });
      
      return next(new AuthenticationError('Invalid token'));
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      logger.warn({
        message: 'JWT token expired',
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });
      
      return next(new AuthenticationError('Token expired'));
    }
    
    next(error);
  }
};

// Optional authentication middleware (doesn't throw if no token)
export const optionalAuthMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  
  // If token is present, validate it
  return authMiddleware(req, res, next);
};

// Role-based authorization middleware
export const requireRole = (...roles: string[]) => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AuthenticationError('Authentication required'));
    }
    
    if (!roles.includes(req.user.role)) {
      logger.warn({
        message: 'Insufficient permissions',
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: roles,
        path: req.path,
      });
      
      return next(new AuthorizationError('Insufficient permissions'));
    }
    
    next();
  };
};

// Resource ownership middleware
export const requireOwnership = (resourceIdParam: string = 'id') => {
  return async (req: AuthenticatedRequest, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return next(new AuthenticationError('Authentication required'));
      }
      
      const resourceId = req.params[resourceIdParam];
      const userId = req.user.id;
      const userRole = req.user.role;
      
      // Admins can access any resource
      if (userRole === 'ADMIN') {
        return next();
      }
      
      // Check resource ownership based on the endpoint
      let isOwner = false;
      
      if (req.route.path.includes('/plants')) {
        const plant = await prisma.plant.findUnique({
          where: { id: resourceId },
          select: { userId: true },
        });
        isOwner = !!(plant && plant.userId === userId);
      } else if (req.route.path.includes('/care-logs')) {
        const careLog = await prisma.careLog.findUnique({
          where: { id: resourceId },
          select: { userId: true },
        });
        isOwner = !!(careLog && careLog.userId === userId);
      } else {
        // Default: check if the resource ID matches the user ID
        isOwner = resourceId === userId;
      }
      
      if (!isOwner) {
        logger.warn({
          message: 'Access denied to resource',
          userId,
          resourceId,
          resourceType: req.route.path,
        });
        
        return next(new AuthorizationError('Access denied to this resource'));
      }
      
      next();
      
    } catch (error) {
      next(error);
    }
  };
};