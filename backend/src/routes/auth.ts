import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { AuthService } from '../services/auth.service';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();
const authService = new AuthService();

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use email from request body if available, otherwise use IP
    return (req.body && req.body.email) || req.ip;
  },
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Zod validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
           'Password must contain uppercase, lowercase, number, and special character'),
  firstName: z.string().min(1, 'First name required').max(50).optional(),
  lastName: z.string().min(1, 'Last name required').max(50).optional(),
  deviceId: z.string().uuid('Invalid device ID'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  deviceId: z.string().uuid('Invalid device ID'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'New password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
           'New password must contain uppercase, lowercase, number, and special character'),
});

// Validation middleware
const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          },
        });
        return;
      }
      next(error);
    }
  };
};

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', 
  authLimiter,
  validate(registerSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password, firstName, lastName, deviceId } = req.body;

      const result = await authService.register({
        email,
        password,
        firstName,
        lastName,
        deviceId,
      });

      logger.info({
        message: 'User registration successful',
        userId: result.user.id,
        email: result.user.email,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.status(201).json({
        message: 'Registration successful',
        user: result.user,
        tokens: result.tokens,
      });
    } catch (error) {
      logger.error({
        message: 'Registration failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        email: req.body.email,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });

      if (error instanceof Error && error.message.includes('already exists')) {
        res.status(409).json({
          error: {
            code: 'USER_ALREADY_EXISTS',
            message: 'A user with this email address already exists',
          },
        });
        return;
      }

      next(error);
    }
  }
);

/**
 * @route POST /api/auth/login
 * @desc Login user
 * @access Public
 */
router.post('/login',
  authLimiter,
  validate(loginSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password, deviceId } = req.body;

      const result = await authService.login({
        email,
        password,
        deviceId,
      });

      logger.info({
        message: 'User login successful',
        userId: result.user.id,
        email: result.user.email,
        deviceId,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json({
        message: 'Login successful',
        user: result.user,
        tokens: result.tokens,
      });
    } catch (error) {
      logger.error({
        message: 'Login failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        email: req.body.email,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });

      if (error instanceof Error && error.message.includes('Invalid email or password')) {
        res.status(401).json({
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password',
          },
        });
        return;
      }

      next(error);
    }
  }
);

/**
 * @route POST /api/auth/refresh
 * @desc Refresh access token
 * @access Public
 */
router.post('/refresh',
  validate(refreshSchema),
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.body;

      const tokens = await authService.refreshTokens(refreshToken);

      logger.info({
        message: 'Token refresh successful',
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json({
        message: 'Token refreshed successfully',
        tokens,
      });
    } catch (error) {
      logger.error({
        message: 'Token refresh failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.status(401).json({
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Invalid or expired refresh token',
        },
      });
    }
  }
);

/**
 * @route POST /api/auth/logout
 * @desc Logout user
 * @access Public
 */
router.post('/logout',
  validate(refreshSchema),
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.body;

      await authService.logout(refreshToken);

      logger.info({
        message: 'User logout successful',
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json({
        message: 'Logout successful',
      });
    } catch (error) {
      logger.error({
        message: 'Logout failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });

      // Don't fail logout if token is invalid
      res.json({
        message: 'Logout successful',
      });
    }
  }
);

/**
 * @route GET /api/auth/me
 * @desc Get current user info
 * @access Private
 */
router.get('/me',
  authMiddleware as any,
  (async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { user } = req;

      res.json({
        user: {
          id: user!.id,
          email: user!.email,
          role: user!.role,
        },
      });
    } catch (error) {
      next(error);
    }
  }) as any
);

/**
 * @route POST /api/auth/change-password
 * @desc Change user password
 * @access Private
 */
router.post('/change-password',
  authMiddleware as any,
  validate(changePasswordSchema),
  (async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user!.id;

      await authService.changePassword(userId, currentPassword, newPassword);

      logger.info({
        message: 'Password change successful',
        userId,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json({
        message: 'Password changed successfully. Please login again.',
      });
    } catch (error) {
      logger.error({
        message: 'Password change failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user ? req.user.id : undefined,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });

      if (error instanceof Error && error.message.includes('Current password is incorrect')) {
        res.status(400).json({
          error: {
            code: 'INVALID_CURRENT_PASSWORD',
            message: 'Current password is incorrect',
          },
        });
        return;
      }

      next(error);
    }
  }) as any
);

/**
 * @route POST /api/auth/revoke-all-tokens
 * @desc Revoke all tokens for the current user
 * @access Private
 */
router.post('/revoke-all-tokens',
  authMiddleware as any,
  (async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;

      await authService.revokeAllTokens(userId);

      logger.info({
        message: 'All tokens revoked',
        userId,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json({
        message: 'All tokens revoked successfully. Please login again.',
      });
    } catch (error) {
      next(error);
    }
  }) as any
);

export { router as authRoutes };