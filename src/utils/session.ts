import { Alert } from 'react-native';
import { dbService } from '../services/supabase';
import { logger } from './logger';

/**
 * Validates the Supabase session and attempts a silent refresh if expired.
 * Returns true if a valid session is available for RLS-protected DB writes.
 *
 * On failure, shows a "Session Expired" alert with a sign-in CTA.
 * Call this before any dbService write that requires authenticated access.
 */
export async function ensureValidSession(
  onRequireSignIn?: () => void
): Promise<boolean> {
  const { data: { session }, error: sessionError } = await dbService.supabase.auth.getSession();

  if (!sessionError && session) {
    return true;
  }

  logger.warn('⚠️ Session invalid - attempting refresh...', { sessionError });
  const { data: { session: refreshed }, error: refreshError } =
    await dbService.supabase.auth.refreshSession();

  if (refreshed && !refreshError) {
    logger.info('✅ Session refreshed successfully');
    return true;
  }

  logger.error('❌ Session refresh failed - user must re-authenticate', { refreshError });
  Alert.alert(
    'Session Expired',
    'Please sign in again to save your changes.',
    [{ text: 'Sign In', onPress: onRequireSignIn }]
  );
  return false;
}
