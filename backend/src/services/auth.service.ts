import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { JWTPayload } from '../middleware/auth';

const prisma = new PrismaClient();

export class AuthService {
  private readonly ACCESS_TOKEN_EXPIRY = '15m';
  private readonly REFRESH_TOKEN_EXPIRY = '7d';
  private readonly TOKEN_VERSION = 1;
  private readonly SALT_ROUNDS = 12;

  async register(userData: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    deviceId: string;
  }): Promise<{
    user: {
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
      role: string;
    };
    tokens: {
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
    };
  }> {
    const { email, password, firstName, lastName, deviceId } = userData;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, this.SALT_ROUNDS);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        lastLoginAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, deviceId);

    logger.info({
      message: 'User registered successfully',
      userId: user.id,
      email: user.email,
    });

    return { user, tokens };
  }

  async login(credentials: {
    email: string;
    password: string;
    deviceId: string;
  }): Promise<{
    user: {
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
      role: string;
    };
    tokens: {
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
    };
  }> {
    const { email, password, deviceId } = credentials;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        passwordHash: true,
        isEmailVerified: true,
        deletedAt: true,
      },
    });

    if (!user || user.deletedAt) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, deviceId);

    logger.info({
      message: 'User logged in successfully',
      userId: user.id,
      email: user.email,
      deviceId,
    });

    const { passwordHash, deletedAt, ...userResponse } = user;
    return { user: userResponse, tokens };
  }

  async refreshTokens(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET!,
        {
          issuer: 'lotus-app',
          audience: 'lotus-api',
        }
      ) as JWTPayload;

      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      // Check if refresh token exists in database and is not revoked
      const storedToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true },
      });

      if (!storedToken || storedToken.revokedAt) {
        throw new Error('Invalid or revoked refresh token');
      }

      if (storedToken.expiresAt < new Date()) {
        throw new Error('Refresh token expired');
      }

      // Revoke old refresh token
      await prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revokedAt: new Date() },
      });

      // Generate new tokens
      const newTokens = await this.generateTokens(decoded.userId, decoded.deviceId);

      logger.info({
        message: 'Tokens refreshed successfully',
        userId: decoded.userId,
        deviceId: decoded.deviceId,
      });

      return newTokens;
    } catch (error) {
      logger.warn({
        message: 'Token refresh failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new Error('Invalid refresh token');
    }
  }

  async logout(refreshToken: string): Promise<void> {
    try {
      // Revoke refresh token
      await prisma.refreshToken.updateMany({
        where: { token: refreshToken },
        data: { revokedAt: new Date() },
      });

      logger.info({
        message: 'User logged out successfully',
      });
    } catch (error) {
      logger.warn({
        message: 'Logout failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new Error('Logout failed');
    }
  }

  async revokeAllTokens(userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    logger.info({
      message: 'All tokens revoked for user',
      userId,
    });
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

    // Update password and revoke all tokens
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          passwordHash: newPasswordHash,
          passwordChangedAt: new Date(),
        },
      }),
      prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    logger.info({
      message: 'Password changed successfully',
      userId,
    });
  }

  private async generateTokens(userId: string, deviceId: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    const tokenId = crypto.randomBytes(16).toString('hex');

    const accessToken = jwt.sign(
      {
        userId,
        deviceId,
        tokenId,
        type: 'access',
        version: this.TOKEN_VERSION,
      },
      process.env.JWT_SECRET!,
      {
        expiresIn: this.ACCESS_TOKEN_EXPIRY,
        issuer: 'lotus-app',
        audience: 'lotus-api',
        algorithm: 'HS256',
      }
    );

    const refreshToken = jwt.sign(
      {
        userId,
        deviceId,
        tokenId,
        type: 'refresh',
        version: this.TOKEN_VERSION,
      },
      process.env.JWT_REFRESH_SECRET!,
      {
        expiresIn: this.REFRESH_TOKEN_EXPIRY,
        issuer: 'lotus-app',
        audience: 'lotus-api',
        algorithm: 'HS256',
      }
    );

    // Store refresh token in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        deviceId,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
    };
  }

  async verifyToken(token: string, type: 'access' | 'refresh'): Promise<JWTPayload> {
    const secret = type === 'access'
      ? process.env.JWT_SECRET!
      : process.env.JWT_REFRESH_SECRET!;

    try {
      const decoded = jwt.verify(token, secret, {
        issuer: 'lotus-app',
        audience: 'lotus-api',
      }) as JWTPayload;

      if (decoded.type !== type) {
        throw new Error('Invalid token type');
      }

      if (decoded.version !== this.TOKEN_VERSION) {
        throw new Error('Token version mismatch');
      }

      return decoded;
    } catch (error) {
      logger.warn({
        message: 'Token verification failed',
        tokenType: type,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new Error('Invalid token');
    }
  }
}