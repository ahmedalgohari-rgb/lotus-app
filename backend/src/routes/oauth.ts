import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { AuthService } from '../services/auth.service';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import {
  googleOAuthSchema,
  appleOAuthSchema,
  linkOAuthProviderSchema,
  unlinkOAuthProviderSchema,
  setOAuthPasswordSchema,
} from '../schemas/oauth.schemas';

const router = Router();
const authService = new AuthService();

// Rate limiting for OAuth endpoints
const oauthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 OAuth requests per windowMs
  message: {
    error: 'Too many OAuth attempts from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for linking/unlinking (more restrictive)
const manageLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 link/unlink requests per windowMs
  message: {
    error: 'Too many provider management attempts from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * @route POST /api/oauth/google
 * @desc Google OAuth sign-in
 * @access Public
 */
router.post('/google', oauthLimiter, async (req: Request, res: Response) => {
  try {
    // Validate request
    const result = googleOAuthSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: result.error.errors,
      });
    }

    const { idToken, deviceId } = result.data;

    // Perform Google OAuth login
    const { user, tokens } = await authService.googleLogin(idToken, deviceId);

    // Log successful OAuth login
    logger.info({
      message: 'Google OAuth login successful',
      userId: user.id,
      email: user.email,
      isNewUser: user.isNewUser,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      message: user.isNewUser ? 'Account created successfully with Google' : 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      tokens: {
        accessToken: tokens.accessToken,
        expiresIn: tokens.expiresIn,
      },
      isNewUser: user.isNewUser,
    });
  } catch (error) {
    logger.error({
      message: 'Google OAuth login failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.status(400).json({
      error: error instanceof Error ? error.message : 'Google OAuth login failed',
    });
  }
});

/**
 * @route POST /api/oauth/apple
 * @desc Apple OAuth sign-in
 * @access Public
 */
router.post('/apple', oauthLimiter, async (req: Request, res: Response) => {
  try {
    // Validate request
    const result = appleOAuthSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: result.error.errors,
      });
    }

    const { idToken, deviceId, clientId } = result.data;

    // Perform Apple OAuth login
    const { user, tokens } = await authService.appleLogin(idToken, deviceId);

    // Log successful OAuth login
    logger.info({
      message: 'Apple OAuth login successful',
      userId: user.id,
      email: user.email,
      isNewUser: user.isNewUser,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      message: user.isNewUser ? 'Account created successfully with Apple ID' : 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      tokens: {
        accessToken: tokens.accessToken,
        expiresIn: tokens.expiresIn,
      },
      isNewUser: user.isNewUser,
    });
  } catch (error) {
    logger.error({
      message: 'Apple OAuth login failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.status(400).json({
      error: error instanceof Error ? error.message : 'Apple OAuth login failed',
    });
  }
});

/**
 * @route POST /api/oauth/link
 * @desc Link OAuth provider to existing account
 * @access Private
 */
router.post('/link', authMiddleware, manageLimiter, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Validate request
    const result = linkOAuthProviderSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: result.error.errors,
      });
    }

    const { provider, idToken } = result.data;
    const userId = req.user!.id;

    // Link OAuth provider
    await authService.linkOAuthProvider(userId, provider, idToken);

    logger.info({
      message: 'OAuth provider linked successfully',
      userId,
      provider,
      ip: req.ip,
    });

    res.status(200).json({
      message: `${provider.charAt(0).toUpperCase() + provider.slice(1)} account linked successfully`,
    });
  } catch (error) {
    logger.error({
      message: 'OAuth provider linking failed',
      userId: req.user?.id,
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.ip,
    });

    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to link OAuth provider',
    });
  }
});

/**
 * @route DELETE /api/oauth/unlink
 * @desc Unlink OAuth provider from account
 * @access Private
 */
router.delete('/unlink', authMiddleware, manageLimiter, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Validate request
    const result = unlinkOAuthProviderSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: result.error.errors,
      });
    }

    const { provider } = result.data;
    const userId = req.user!.id;

    // Unlink OAuth provider
    await authService.unlinkOAuthProvider(userId, provider);

    logger.info({
      message: 'OAuth provider unlinked successfully',
      userId,
      provider,
      ip: req.ip,
    });

    res.status(200).json({
      message: `${provider.charAt(0).toUpperCase() + provider.slice(1)} account unlinked successfully`,
    });
  } catch (error) {
    logger.error({
      message: 'OAuth provider unlinking failed',
      userId: req.user?.id,
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.ip,
    });

    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to unlink OAuth provider',
    });
  }
});

/**
 * @route GET /api/oauth/providers
 * @desc Get user's linked OAuth providers
 * @access Private
 */
router.get('/providers', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // Get user's OAuth providers
    const providers = await authService.getUserOAuthProviders(userId);

    res.status(200).json({
      providers,
    });
  } catch (error) {
    logger.error({
      message: 'Failed to get OAuth providers',
      userId: req.user?.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({
      error: 'Failed to get OAuth providers',
    });
  }
});

/**
 * @route POST /api/oauth/set-password
 * @desc Set password for OAuth-only user
 * @access Private
 */
router.post('/set-password', authMiddleware, manageLimiter, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Validate request
    const result = setOAuthPasswordSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: result.error.errors,
      });
    }

    const { password } = result.data;
    const userId = req.user!.id;

    // Set password for OAuth user
    await authService.setPasswordForOAuthUser(userId, password);

    logger.info({
      message: 'Password set for OAuth user',
      userId,
      ip: req.ip,
    });

    res.status(200).json({
      message: 'Password set successfully. You can now also sign in with email and password.',
    });
  } catch (error) {
    logger.error({
      message: 'Failed to set password for OAuth user',
      userId: req.user?.id,
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.ip,
    });

    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to set password',
    });
  }
});

export { router as oauthRoutes };