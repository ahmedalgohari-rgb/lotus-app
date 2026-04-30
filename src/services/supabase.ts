import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as FileSystem from 'expo-file-system';
import { Plant, PlantSpecies, CareEvent, User } from '../types';
import { logger } from '../utils/logger';
import { trackAuthCompleted, identifyUser } from './analytics';

// NOTE: For production builds with native Apple Sign-In:
// 1. npm install expo-apple-authentication
// 2. Set usesAppleSignIn: true in app.json
// 3. Use EAS build (npx eas build --profile development --platform ios)
// For now, we use OAuth web flow which works in Expo Go

// OAuth error type for better type safety
interface OAuthError {
  message: string;
  name: string;
  status: number;
}

// Session polling configuration constants
const SESSION_POLL_INTERVAL_MS = 500;
const SESSION_POLL_MAX_ATTEMPTS = 40; // 20 second timeout (40 × 500ms)

// Helper function to create OAuth error responses
function createOAuthError(message: string, name: string, status: number) {
  return { data: null, error: { message, name, status } as OAuthError };
}

// Complete the browser session on Android
WebBrowser.maybeCompleteAuthSession();

export const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  logger.warn('Missing Supabase environment variables');
}

const redirectTo = makeRedirectUri({
  scheme: 'lotus',
  path: 'auth/callback',
});

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // React Native uses deep links, not browser URL params
  },
});

// Auth helpers
export const authService = {
  /**
   * Generic OAuth sign-in method
   * Handles Google, Apple, and Facebook OAuth with provider-specific configurations
   */
  _signInWithOAuth: async (
    provider: 'google' | 'apple' | 'facebook',
    options?: { queryParams?: Record<string, string>; useSessionPolling?: boolean }
  ) => {
    try {
      // Get the OAuth URL from Supabase
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          skipBrowserRedirect: true,
          queryParams: options?.queryParams,
        },
      });

      if (error) {
        logger.error(`${provider} OAuth URL generation failed:`, error);
        return { data: null, error };
      }

      if (!data?.url) {
        logger.error('No OAuth URL returned from Supabase');
        return createOAuthError('No OAuth URL returned', 'OAuthError', 500);
      }

      // Open the OAuth URL in the browser
      logger.debug(`Opening ${provider} OAuth browser with URL:`, data.url);
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

      // Log the full result for debugging
      logger.debug(`WebBrowser result type: ${result.type}`);
      if ('url' in result) {
        logger.debug(`WebBrowser result URL: ${result.url}`);
      }

      if (result.type === 'success') {
        logger.debug(`${provider} OAuth browser returned successfully`);

        // FIRST: Always try to extract tokens from URL (works for all providers)
        // Supabase puts tokens in URL fragment even for Apple OAuth
        if ('url' in result && result.url) {
          logger.debug('Attempting token extraction from redirect URL:', result.url);
          const url = result.url;
          const tokenParams: Record<string, string> = {};

          // Parse URL fragment for tokens
          const fragment = url.split('#')[1];
          if (fragment) {
            fragment.split('&').forEach(part => {
              const [key, value] = part.split('=');
              if (key && value) {
                tokenParams[key] = decodeURIComponent(value);
              }
            });
          }

          logger.debug('Extracted token params:', Object.keys(tokenParams));

          const accessToken = tokenParams['access_token'];
          const refreshToken = tokenParams['refresh_token'];

          if (accessToken && refreshToken) {
            logger.debug('Found tokens in URL! Setting session...');
            const sessionResult = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (!sessionResult.error && sessionResult.data.session) {
              logger.debug(`${provider} OAuth successful via URL token extraction`);
              const authUser = sessionResult.data.session.user;
              trackAuthCompleted({ method: provider });
              identifyUser(authUser.id, { name: authUser.user_metadata?.name, email: authUser.email });
              return {
                data: {
                  user: authUser,
                  session: sessionResult.data.session
                },
                error: null
              };
            } else if (sessionResult.error) {
              logger.error('Failed to set session from URL tokens:', sessionResult.error);
            }
          } else {
            logger.debug('No tokens found in URL fragment, trying alternative methods...');
          }
        }

        // FALLBACK: Session polling (for Apple when URL extraction fails)
        if (options?.useSessionPolling) {
          logger.debug(`URL extraction failed, polling for session (max ${SESSION_POLL_MAX_ATTEMPTS * SESSION_POLL_INTERVAL_MS / 1000} seconds)...`);
          let sessionData = null;

          for (let i = 0; i < SESSION_POLL_MAX_ATTEMPTS; i++) {
            await new Promise(resolve => setTimeout(resolve, SESSION_POLL_INTERVAL_MS));
            const pollResult = await supabase.auth.getSession();

            if (pollResult.data.session) {
              sessionData = pollResult;
              logger.debug(`Session found after ${(i + 1) * SESSION_POLL_INTERVAL_MS}ms`);
              break;
            }
          }

          if (!sessionData?.data?.session) {
            const timeoutSeconds = (SESSION_POLL_MAX_ATTEMPTS * SESSION_POLL_INTERVAL_MS) / 1000;
            logger.error(`No session found after OAuth completion (timeout after ${timeoutSeconds} seconds)`);
            return createOAuthError(
              `OAuth timeout - session not created within ${timeoutSeconds} seconds`,
              'TimeoutError',
              408
            );
          }

          if (sessionData.error) {
            logger.error('Failed to get session after OAuth:', sessionData.error);
            return { data: null, error: sessionData.error };
          }

          logger.debug(`${provider} OAuth successful, session retrieved via polling`);
          const polledUser = sessionData.data.session.user;
          trackAuthCompleted({ method: provider });
          identifyUser(polledUser.id, { name: polledUser.user_metadata?.name, email: polledUser.email });
          return {
            data: {
              user: polledUser,
              session: sessionData.data.session
            },
            error: null
          };
        }

        // If we get here, token extraction failed and no session polling
        // This means something went wrong with the OAuth flow
        logger.error('Token extraction failed and no session polling configured');
        return createOAuthError('No tokens in redirect URL', 'OAuthError', 500);
      } else if (result.type === 'cancel' || result.type === 'dismiss') {
        // Safari might show 'cancel' when it can't navigate to lotus:// scheme
        // but the URL with tokens might still be in the result
        logger.info(`Browser returned '${result.type}', checking for tokens...`);

        // FIRST: Try to extract tokens from URL (Safari might have captured it)
        if ('url' in result && result.url) {
          logger.debug('Found URL in cancelled/dismissed result:', result.url);
          const tokenParams: Record<string, string> = {};
          const fragment = result.url.split('#')[1];
          if (fragment) {
            fragment.split('&').forEach(part => {
              const [key, value] = part.split('=');
              if (key && value) {
                tokenParams[key] = decodeURIComponent(value);
              }
            });
          }

          const accessToken = tokenParams['access_token'];
          const refreshToken = tokenParams['refresh_token'];

          if (accessToken && refreshToken) {
            logger.debug('Found tokens in cancelled result! Setting session...');
            const sessionResult = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (!sessionResult.error && sessionResult.data.session) {
              logger.success(`${provider} OAuth successful via URL extraction (despite browser ${result.type})`);
              const cancelUser = sessionResult.data.session.user;
              trackAuthCompleted({ method: provider });
              identifyUser(cancelUser.id, { name: cancelUser.user_metadata?.name, email: cancelUser.email });
              return {
                data: {
                  user: cancelUser,
                  session: sessionResult.data.session
                },
                error: null
              };
            }
          }
        }

        // FALLBACK: Session polling for Apple OAuth
        if (options?.useSessionPolling) {
          logger.info(`No tokens in URL, polling for session (Apple OAuth workaround)...`);
          let sessionData = null;

          for (let i = 0; i < SESSION_POLL_MAX_ATTEMPTS; i++) {
            await new Promise(resolve => setTimeout(resolve, SESSION_POLL_INTERVAL_MS));
            const pollResult = await supabase.auth.getSession();

            if (pollResult.data.session) {
              sessionData = pollResult;
              logger.debug(`Session found after browser '${result.type}' (${(i + 1) * SESSION_POLL_INTERVAL_MS}ms)`);
              break;
            }
          }

          if (sessionData?.data?.session) {
            logger.success(`${provider} OAuth successful via polling despite browser ${result.type}`);
            const pollUser = sessionData.data.session.user;
            trackAuthCompleted({ method: provider });
            identifyUser(pollUser.id, { name: pollUser.user_metadata?.name, email: pollUser.email });
            return {
              data: {
                user: pollUser,
                session: sessionData.data.session
              },
              error: null
            };
          }
        }

        logger.info(`User cancelled ${provider} OAuth (no session found)`);
        return createOAuthError('User cancelled OAuth', 'UserCancelled', 400);
      } else {
        logger.error(`${provider} OAuth failed with type:`, result.type);
        return createOAuthError('OAuth browser session failed', 'BrowserError', 500);
      }
    } catch (err) {
      logger.error(`${provider} OAuth error:`, err);
      return { data: null, error: err as any };
    }
  },

  signInWithGoogle: async () => {
    return authService._signInWithOAuth('google', {
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
      useSessionPolling: false, // Google uses URL token extraction
    });
  },

  signInWithApple: async () => {
    // Using OAuth web flow (works in Expo Go and development)
    // For production with native Apple Sign-In, see comments at top of file
    logger.debug('Starting Apple Sign-In via OAuth web flow...');
    return authService._signInWithOAuth('apple', {
      useSessionPolling: true,
    });
  },

  signInWithFacebook: async () => {
    return authService._signInWithOAuth('facebook', {
      queryParams: {
        scope: 'email,public_profile',
      },
      useSessionPolling: false, // Facebook uses URL token extraction
    });
  },

  /**
   * Link an OAuth identity to the currently signed-in (anonymous) user.
   * Preserves user_id and all data — used when an anonymous guest upgrades to a permanent account.
   */
  _linkIdentity: async (provider: 'google' | 'apple' | 'facebook') => {
    try {
      const { data, error } = await supabase.auth.linkIdentity({
        provider,
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        logger.error(`${provider} linkIdentity URL generation failed:`, error);
        return { data: null, error };
      }

      if (!data?.url) {
        return createOAuthError('No OAuth URL returned for link', 'OAuthError', 500);
      }

      logger.debug(`Opening ${provider} link browser`);
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

      const tryExtractTokens = (url?: string) => {
        if (!url) return null;
        const fragment = url.split('#')[1];
        if (!fragment) return null;
        const tokenParams: Record<string, string> = {};
        fragment.split('&').forEach(part => {
          const [key, value] = part.split('=');
          if (key && value) tokenParams[key] = decodeURIComponent(value);
        });
        const access = tokenParams['access_token'];
        const refresh = tokenParams['refresh_token'];
        return access && refresh ? { access, refresh } : null;
      };

      const tokens = ('url' in result && result.url) ? tryExtractTokens(result.url) : null;

      if (tokens) {
        const sessionResult = await supabase.auth.setSession({
          access_token: tokens.access,
          refresh_token: tokens.refresh,
        });
        if (!sessionResult.error && sessionResult.data.session) {
          const linkedUser = sessionResult.data.session.user;
          logger.success(`${provider} identity linked — user_id preserved: ${linkedUser.id}`);
          trackAuthCompleted({ method: provider });
          identifyUser(linkedUser.id, { name: linkedUser.user_metadata?.name, email: linkedUser.email });
          return { data: { user: linkedUser, session: sessionResult.data.session }, error: null };
        }
      }

      // Fallback: poll for refreshed session (Apple often delivers tokens out-of-band)
      for (let i = 0; i < SESSION_POLL_MAX_ATTEMPTS; i++) {
        await new Promise(resolve => setTimeout(resolve, SESSION_POLL_INTERVAL_MS));
        const { data: refreshedUser } = await supabase.auth.getUser();
        if (refreshedUser?.user && !refreshedUser.user.is_anonymous) {
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData.session) {
            logger.success(`${provider} identity linked via session poll`);
            trackAuthCompleted({ method: provider });
            identifyUser(refreshedUser.user.id, { name: refreshedUser.user.user_metadata?.name, email: refreshedUser.user.email });
            return { data: { user: refreshedUser.user, session: sessionData.session }, error: null };
          }
        }
      }

      if (result.type === 'cancel' || result.type === 'dismiss') {
        return createOAuthError('User cancelled link', 'UserCancelled', 400);
      }
      return createOAuthError('Identity link timed out', 'TimeoutError', 408);
    } catch (err) {
      logger.error(`${provider} linkIdentity error:`, err);
      return { data: null, error: err as any };
    }
  },

  linkWithGoogle: async () => authService._linkIdentity('google'),
  linkWithApple: async () => authService._linkIdentity('apple'),
  linkWithFacebook: async () => authService._linkIdentity('facebook'),

  /**
   * Sign in anonymously for guest users
   * Creates a temporary Supabase session that allows PlantNet API calls
   * while maintaining rate limiting and security
   */
  signInAnonymously: async () => {
    logger.info('Creating anonymous guest session...');
    const { data, error } = await supabase.auth.signInAnonymously();

    if (error) {
      logger.error('Anonymous sign-in failed:', error);
      return { data: null, error };
    }

    logger.success('Guest session created', { userId: data?.user?.id });
    return { data, error: null };
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },

  getSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
  },

  signUp: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
      }
    });
    return { data, error };
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },
};

// Database helpers
export const dbService = {
  // Plants
  getPlants: async (userId: string) => {
    const { data, error } = await supabase
      .from('plants')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  addPlant: async (plant: Omit<Plant, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('plants')
      .insert([plant])
      .select()
      .single();
    return { data, error };
  },

  updatePlant: async (id: string, updates: Partial<Plant>) => {
    const { data, error } = await supabase
      .from('plants')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },

  deletePlant: async (id: string) => {
    const { error } = await supabase
      .from('plants')
      .delete()
      .eq('id', id);
    return { error };
  },

  // Plant Species
  getPlantSpecies: async () => {
    const { data, error } = await supabase
      .from('plant_species')
      .select('*')
      .order('name_en');
    return { data, error };
  },

  getPlantSpeciesById: async (id: string) => {
    const { data, error } = await supabase
      .from('plant_species')
      .select('*')
      .eq('id', id)
      .single();
    return { data, error };
  },

  // Care Events
  getCareEvents: async (plantId: string) => {
    const { data, error } = await supabase
      .from('care_events')
      .select('*')
      .eq('plant_id', plantId)
      .order('completed_at', { ascending: false });
    return { data, error };
  },

  addCareEvent: async (event: Omit<CareEvent, 'id' | 'created_at'>) => {
    const { data, error } = await supabase
      .from('care_events')
      .insert([event])
      .select()
      .single();
    return { data, error };
  },

  // User Profile
  getProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    return { data, error };
  },

  updateProfile: async (userId: string, updates: Partial<User>) => {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    return { data, error };
  },

  updateUserProfile: async (userId: string, firstName: string) => {
    // Use upsert to insert if not exists, or update if exists
    const { data, error } = await supabase
      .from('profiles')
      .upsert(
        {
          id: userId,
          first_name: firstName,
          updated_at: new Date().toISOString()
        },
        {
          onConflict: 'id',
          ignoreDuplicates: false
        }
      )
      .select()
      .single();
    return { data, error };
  },

  // Storage
  uploadImage: async (file: { uri: string; type: string; name: string }, bucket: string = 'plant-images') => {
    try {
      // Check if URI is already a remote URL (from search results)
      if (file.uri.startsWith('http://') || file.uri.startsWith('https://')) {
        logger.info('Using existing remote image URL:', file.uri);
        return file.uri; // Return the remote URL directly, no upload needed
      }

      // Local file - proceed with upload to Supabase
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;

      const base64 = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Convert base64 to ArrayBuffer for proper binary upload
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, bytes.buffer, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        if (uploadError.message.includes('Bucket not found')) {
          logger.error(`Supabase Storage Error: Bucket '${bucket}' not found. Please create it in your Supabase project dashboard.`);
        }
        throw uploadError;
      }

      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      if (!data.publicUrl) {
        throw new Error('Failed to get public URL for the uploaded image.');
      }

      return data.publicUrl;
    } catch (error) {
      logger.error('Upload error:', error);
      throw error; // Re-throw the error to be handled by the caller
    }
  },

  // ⚡ NEW: Delete uploaded image from cloud storage
  deleteUploadedImage: async (imageUrl: string): Promise<boolean> => {
    try {
      // Extract filename from public URL
      // Example URL: https://abc.supabase.co/storage/v1/object/public/plant-images/1765755127085.webp
      const urlParts = imageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1]; // Get the last part (filename)
      const bucket = urlParts[urlParts.length - 2]; // Get bucket name

      if (!fileName) {
        logger.warn('Could not extract filename from URL:', imageUrl);
        return false;
      }

      logger.info('🗑️ Deleting image from cloud storage', { bucket, fileName });

      const { error } = await supabase.storage
        .from(bucket)
        .remove([fileName]);

      if (error) {
        logger.error('Failed to delete image from storage:', error);
        return false;
      }

      logger.info('✅ Image deleted successfully', { fileName });
      return true;
    } catch (error) {
      logger.error('Delete error:', error);
      return false;
    }
  },

  // Expose Supabase client for auth operations
  supabase,
};