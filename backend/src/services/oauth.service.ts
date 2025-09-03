import { OAuth2Client } from 'google-auth-library';
import appleSignin from 'apple-signin-auth';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

interface GoogleTokenPayload {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  locale?: string;
}

interface AppleTokenPayload {
  sub: string;
  email?: string;
  email_verified?: boolean;
  real_user_status?: number;
}

interface OAuthUserInfo {
  providerId: string;
  email: string;
  emailVerified: boolean;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  locale?: string;
  provider: 'google' | 'apple';
  providerData: any;
}

export class OAuthService {
  private googleClient: OAuth2Client;

  constructor() {
    this.googleClient = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
  }

  /**
   * Verify Google ID token and extract user information
   */
  async verifyGoogleToken(idToken: string, audience?: string): Promise<OAuthUserInfo> {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: audience || process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload() as GoogleTokenPayload;
      
      if (!payload) {
        throw new Error('Invalid Google token payload');
      }

      logger.info({
        message: 'Google token verified successfully',
        providerId: payload.sub,
        email: payload.email,
      });

      return {
        providerId: payload.sub,
        email: payload.email,
        emailVerified: payload.email_verified || false,
        firstName: payload.given_name,
        lastName: payload.family_name,
        avatarUrl: payload.picture,
        locale: payload.locale,
        provider: 'google',
        providerData: payload,
      };
    } catch (error) {
      logger.error({
        message: 'Google token verification failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new Error('Invalid Google token');
    }
  }

  /**
   * Verify Apple ID token and extract user information
   */
  async verifyAppleToken(
    idToken: string, 
    clientId: string = process.env.APPLE_CLIENT_ID!
  ): Promise<OAuthUserInfo> {
    try {
      const payload = await appleSignin.verifyIdToken(idToken, {
        audience: clientId,
        nonce: 'nonce', // In production, use a proper nonce
        ignoreExpiration: false,
      }) as AppleTokenPayload;

      if (!payload) {
        throw new Error('Invalid Apple token payload');
      }

      logger.info({
        message: 'Apple token verified successfully',
        providerId: payload.sub,
        email: payload.email,
      });

      return {
        providerId: payload.sub,
        email: payload.email || '',
        emailVerified: payload.email_verified || false,
        provider: 'apple',
        providerData: payload,
      };
    } catch (error) {
      logger.error({
        message: 'Apple token verification failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new Error('Invalid Apple token');
    }
  }

  /**
   * Find or create user based on OAuth provider information
   */
  async findOrCreateOAuthUser(
    oauthInfo: OAuthUserInfo, 
    deviceId: string
  ): Promise<{
    user: {
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
      role: string;
      isNewUser: boolean;
    };
    isNewUser: boolean;
  }> {
    try {
      // First, check if we have an existing OAuth provider record
      let existingProvider = await prisma.oAuthProvider.findUnique({
        where: {
          provider_providerId: {
            provider: oauthInfo.provider,
            providerId: oauthInfo.providerId,
          },
        },
        include: { user: true },
      });

      if (existingProvider && existingProvider.user && !existingProvider.user.deletedAt) {
        // Update provider data and return existing user
        await prisma.oAuthProvider.update({
          where: { id: existingProvider.id },
          data: {
            email: oauthInfo.email,
            providerData: JSON.stringify(oauthInfo.providerData),
            updatedAt: new Date(),
          },
        });

        // Update user's last login
        const updatedUser = await prisma.user.update({
          where: { id: existingProvider.user.id },
          data: { lastLoginAt: new Date() },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        });

        return { user: { ...updatedUser, isNewUser: false }, isNewUser: false };
      }

      // Check if user exists with the same email but different provider
      let existingUser = await prisma.user.findUnique({
        where: { email: oauthInfo.email },
        include: { oauthProviders: true },
      });

      if (existingUser && !existingUser.deletedAt) {
        // Link new OAuth provider to existing user
        await prisma.oAuthProvider.create({
          data: {
            userId: existingUser.id,
            provider: oauthInfo.provider,
            providerId: oauthInfo.providerId,
            email: oauthInfo.email,
            providerData: JSON.stringify(oauthInfo.providerData),
          },
        });

        // Update auth provider to 'multiple' if not already
        const authProvider = existingUser.oauthProviders.length > 0 ? 'multiple' : oauthInfo.provider;
        
        const updatedUser = await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            authProvider,
            providerVerified: oauthInfo.emailVerified,
            lastLoginAt: new Date(),
            // Update profile info if missing
            firstName: existingUser.firstName || oauthInfo.firstName,
            lastName: existingUser.lastName || oauthInfo.lastName,
            avatarUrl: existingUser.avatarUrl || oauthInfo.avatarUrl,
            isEmailVerified: existingUser.isEmailVerified || oauthInfo.emailVerified,
          },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        });

        return { user: { ...updatedUser, isNewUser: false }, isNewUser: false };
      }

      // Create new user with OAuth provider
      const newUser = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: oauthInfo.email,
            firstName: oauthInfo.firstName,
            lastName: oauthInfo.lastName,
            avatarUrl: oauthInfo.avatarUrl,
            authProvider: oauthInfo.provider,
            providerVerified: oauthInfo.emailVerified,
            isEmailVerified: oauthInfo.emailVerified,
            emailVerifiedAt: oauthInfo.emailVerified ? new Date() : null,
            language: oauthInfo.locale?.startsWith('ar') ? 'ar' : 'en',
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

        // Create OAuth provider record
        await tx.oAuthProvider.create({
          data: {
            userId: user.id,
            provider: oauthInfo.provider,
            providerId: oauthInfo.providerId,
            email: oauthInfo.email,
            providerData: JSON.stringify(oauthInfo.providerData),
          },
        });

        return user;
      });

      logger.info({
        message: 'New OAuth user created successfully',
        userId: newUser.id,
        provider: oauthInfo.provider,
        email: oauthInfo.email,
      });

      return { user: { ...newUser, isNewUser: true }, isNewUser: true };
    } catch (error) {
      logger.error({
        message: 'OAuth user creation failed',
        provider: oauthInfo.provider,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new Error('Failed to create OAuth user');
    }
  }

  /**
   * Link OAuth provider to existing authenticated user
   */
  async linkOAuthProvider(
    userId: string, 
    oauthInfo: OAuthUserInfo
  ): Promise<void> {
    try {
      // Check if provider is already linked to any user
      const existingProvider = await prisma.oAuthProvider.findUnique({
        where: {
          provider_providerId: {
            provider: oauthInfo.provider,
            providerId: oauthInfo.providerId,
          },
        },
      });

      if (existingProvider) {
        if (existingProvider.userId === userId) {
          throw new Error(`${oauthInfo.provider} account is already linked to your account`);
        } else {
          throw new Error(`This ${oauthInfo.provider} account is already linked to another user`);
        }
      }

      // Check if provider email matches user's email
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { oauthProviders: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      if (user.email !== oauthInfo.email) {
        throw new Error('OAuth provider email does not match your account email');
      }

      // Create OAuth provider link
      await prisma.$transaction(async (tx) => {
        await tx.oAuthProvider.create({
          data: {
            userId,
            provider: oauthInfo.provider,
            providerId: oauthInfo.providerId,
            email: oauthInfo.email,
            providerData: JSON.stringify(oauthInfo.providerData),
          },
        });

        // Update user's auth provider to 'multiple' if they now have multiple providers
        const authProvider = user.oauthProviders.length > 0 ? 'multiple' : oauthInfo.provider;
        await tx.user.update({
          where: { id: userId },
          data: {
            authProvider,
            providerVerified: oauthInfo.emailVerified,
            // Update profile info if missing
            avatarUrl: user.avatarUrl || oauthInfo.avatarUrl,
            isEmailVerified: user.isEmailVerified || oauthInfo.emailVerified,
          },
        });
      });

      logger.info({
        message: 'OAuth provider linked successfully',
        userId,
        provider: oauthInfo.provider,
        email: oauthInfo.email,
      });
    } catch (error) {
      logger.error({
        message: 'OAuth provider linking failed',
        userId,
        provider: oauthInfo.provider,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Unlink OAuth provider from user
   */
  async unlinkOAuthProvider(userId: string, provider: 'google' | 'apple'): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { oauthProviders: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Ensure user has password or another OAuth provider before unlinking
      const otherProviders = user.oauthProviders.filter(p => p.provider !== provider);
      if (!user.passwordHash && otherProviders.length === 0) {
        throw new Error('Cannot unlink the only authentication method. Please set a password first.');
      }

      // Remove OAuth provider
      await prisma.$transaction(async (tx) => {
        await tx.oAuthProvider.deleteMany({
          where: {
            userId,
            provider,
          },
        });

        // Update user's auth provider
        let newAuthProvider = 'email';
        if (user.passwordHash && otherProviders.length > 0) {
          newAuthProvider = 'multiple';
        } else if (otherProviders.length === 1) {
          newAuthProvider = otherProviders[0].provider;
        } else if (otherProviders.length > 1) {
          newAuthProvider = 'multiple';
        }

        await tx.user.update({
          where: { id: userId },
          data: { authProvider: newAuthProvider },
        });
      });

      logger.info({
        message: 'OAuth provider unlinked successfully',
        userId,
        provider,
      });
    } catch (error) {
      logger.error({
        message: 'OAuth provider unlinking failed',
        userId,
        provider,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get user's linked OAuth providers
   */
  async getUserOAuthProviders(userId: string): Promise<Array<{
    provider: string;
    email: string;
    createdAt: Date;
  }>> {
    try {
      const providers = await prisma.oAuthProvider.findMany({
        where: { userId },
        select: {
          provider: true,
          email: true,
          createdAt: true,
        },
      });

      return providers;
    } catch (error) {
      logger.error({
        message: 'Failed to get user OAuth providers',
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new Error('Failed to get OAuth providers');
    }
  }
}