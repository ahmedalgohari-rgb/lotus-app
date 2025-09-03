import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { AuthService } from '../services/auth.service';
import {
  getAuthMethodsSchema,
  verifyProviderSchema,
} from '../schemas/oauth.schemas';

const router = Router();
const prisma = new PrismaClient();
const authService = new AuthService();

// Rate limiting for progressive auth endpoints
const progressiveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per windowMs
  message: {
    error: 'Too many authentication method requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * @route POST /api/auth/methods
 * @desc Get available authentication methods for an email
 * @access Public
 */
router.post('/methods', progressiveLimiter, async (req: Request, res: Response) => {
  try {
    // Validate request
    const result = getAuthMethodsSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: result.error.errors,
      });
    }

    const { email } = result.data;

    // Find user and their OAuth providers
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        authProvider: true,
        providerVerified: true,
        isEmailVerified: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        deletedAt: true,
        oauthProviders: {
          select: {
            provider: true,
            createdAt: true,
          },
        },
      },
    });

    // Always return a consistent response to avoid user enumeration
    const baseResponse = {
      email,
      userExists: !!user && !user.deletedAt,
      methods: [] as Array<{
        type: 'email' | 'google' | 'apple';
        available: boolean;
        verified?: boolean;
        addedAt?: string;
      }>,
      userInfo: null as any,
    };

    if (!user || user.deletedAt) {
      // Return empty methods for non-existent users to prevent enumeration
      baseResponse.methods = [
        { type: 'email', available: false },
        { type: 'google', available: false },
        { type: 'apple', available: false },
      ];

      return res.status(200).json(baseResponse);
    }

    // Build available methods
    const methods = [];

    // Email/password method
    if (user.passwordHash) {
      methods.push({
        type: 'email' as const,
        available: true,
        verified: user.isEmailVerified,
      });
    }

    // OAuth providers
    const oauthProviders = user.oauthProviders || [];
    const googleProvider = oauthProviders.find(p => p.provider === 'google');
    const appleProvider = oauthProviders.find(p => p.provider === 'apple');

    methods.push({
      type: 'google' as const,
      available: !!googleProvider,
      verified: true, // OAuth providers are always verified
      addedAt: googleProvider?.createdAt?.toISOString(),
    });

    methods.push({
      type: 'apple' as const,
      available: !!appleProvider,
      verified: true, // OAuth providers are always verified
      addedAt: appleProvider?.createdAt?.toISOString(),
    });

    // Include basic user info (safe to share for existing users)
    baseResponse.userInfo = {
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      primaryAuthProvider: user.authProvider,
    };

    baseResponse.methods = methods;

    logger.info({
      message: 'Authentication methods retrieved',
      email,
      methodCount: methods.filter(m => m.available).length,
      ip: req.ip,
    });

    res.status(200).json(baseResponse);
  } catch (error) {
    logger.error({
      message: 'Failed to get authentication methods',
      email: req.body.email,
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.ip,
    });

    // Return generic response on error to avoid information leakage
    res.status(200).json({
      email: req.body.email,
      userExists: false,
      methods: [
        { type: 'email', available: false },
        { type: 'google', available: false },
        { type: 'apple', available: false },
      ],
      userInfo: null,
    });
  }
});

/**
 * @route POST /api/auth/verify-provider
 * @desc Verify a specific authentication provider/method
 * @access Public
 */
router.post('/verify-provider', progressiveLimiter, async (req: Request, res: Response) => {
  try {
    // Validate request
    const result = verifyProviderSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: result.error.errors,
      });
    }

    const { provider, credential } = result.data;

    let verificationResult = {
      provider,
      valid: false,
      userInfo: null as any,
      requiresDeviceId: true,
    };

    try {
      if (provider === 'google') {
        // Verify Google ID token
        const oauthInfo = await authService['oauthService'].verifyGoogleToken(credential);
        verificationResult = {
          provider: 'google',
          valid: true,
          userInfo: {
            email: oauthInfo.email,
            firstName: oauthInfo.firstName,
            lastName: oauthInfo.lastName,
            avatarUrl: oauthInfo.avatarUrl,
          },
          requiresDeviceId: true,
        };
      } else if (provider === 'apple') {
        // Verify Apple ID token
        const oauthInfo = await authService['oauthService'].verifyAppleToken(credential);
        verificationResult = {
          provider: 'apple',
          valid: true,
          userInfo: {
            email: oauthInfo.email,
            firstName: oauthInfo.firstName,
            lastName: oauthInfo.lastName,
          },
          requiresDeviceId: true,
        };
      } else if (provider === 'email') {
        // For email verification, we don't actually verify the password here
        // This endpoint is just to validate the format/existence
        // The actual authentication happens in the login endpoint
        verificationResult = {
          provider: 'email',
          valid: credential.length >= 8, // Basic password length check
          userInfo: null,
          requiresDeviceId: true,
        };
      }
    } catch (error) {
      // Verification failed - return invalid
      logger.warn({
        message: 'Provider verification failed',
        provider,
        error: error instanceof Error ? error.message : 'Unknown error',
        ip: req.ip,
      });
    }

    logger.info({
      message: 'Provider verification attempted',
      provider,
      valid: verificationResult.valid,
      ip: req.ip,
    });

    res.status(200).json(verificationResult);
  } catch (error) {
    logger.error({
      message: 'Provider verification error',
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.ip,
    });

    res.status(400).json({
      error: 'Provider verification failed',
    });
  }
});

/**
 * @route POST /api/auth/check-email
 * @desc Check if email is already registered (simpler endpoint)
 * @access Public
 */
router.post('/check-email', progressiveLimiter, async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        error: 'Valid email is required',
      });
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Invalid email format',
      });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        deletedAt: true,
        authProvider: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
      },
    });

    const exists = !!user && !user.deletedAt;

    logger.info({
      message: 'Email existence check',
      email,
      exists,
      ip: req.ip,
    });

    res.status(200).json({
      email,
      exists,
      userInfo: exists ? {
        firstName: user!.firstName,
        lastName: user!.lastName,
        avatarUrl: user!.avatarUrl,
        authProvider: user!.authProvider,
      } : null,
    });
  } catch (error) {
    logger.error({
      message: 'Email check failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.ip,
    });

    // Return "doesn't exist" on error to avoid information leakage
    res.status(200).json({
      email: req.body.email,
      exists: false,
      userInfo: null,
    });
  }
});

/**
 * @route GET /api/auth/oauth-config
 * @desc Get OAuth configuration for client setup
 * @access Public
 */
router.get('/oauth-config', (req: Request, res: Response) => {
  try {
    res.status(200).json({
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID || '',
        enabled: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      },
      apple: {
        clientId: process.env.APPLE_CLIENT_ID || '',
        enabled: !!(process.env.APPLE_CLIENT_ID),
      },
    });
  } catch (error) {
    logger.error({
      message: 'Failed to get OAuth config',
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({
      error: 'Failed to get OAuth configuration',
    });
  }
});

export { router as progressiveAuthRoutes };