/**
 * AccountDrawer Component
 *
 * A right-side slide-in drawer for account-related actions
 * - Slides from right edge (80% width, 100% height)
 * - Cairo Sand background
 * - Displays username and menu items (non-functional placeholders)
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS, FIBONACCI, TYPOGRAPHY } from '../constants';
import { useRTL } from '../utils/rtl';
import { useStore } from '../store';
import { authService } from '../services/supabase';
import { logger } from '../utils/logger';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const DRAWER_WIDTH = SCREEN_WIDTH * 0.8;

interface AccountDrawerProps {
  visible: boolean;
  onClose: () => void;
  userName?: string;
}

export default function AccountDrawer({ visible, onClose, userName = 'Guest' }: AccountDrawerProps) {
  const { t } = useTranslation();
  const isRTL = useRTL();
  const { clearStorage, setAuthenticated } = useStore();
  // ALWAYS start off-screen to the RIGHT (drawer width off-screen)
  const slideAnim = useRef(new Animated.Value(DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const [shouldRender, setShouldRender] = useState(visible);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Animate drawer open/close with enhanced timing
  useEffect(() => {
    if (visible) {
      setShouldRender(true);

      // Parallel animations for smooth entrance
      Animated.parallel([
        // Slide in from RIGHT with smooth easing (ALWAYS from right, regardless of language)
        Animated.timing(slideAnim, {
          toValue: 0, // No transform = full 80% drawer visible at right: 0
          duration: 600, // Slower, more elegant slide-in
          easing: Easing.bezier(0.25, 0.1, 0.25, 1), // Smooth ease-out
          useNativeDriver: true,
        }),
        // Fade in backdrop
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 350,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        // Scale up drawer slightly for modern effect
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Parallel animations for smooth exit
      Animated.parallel([
        // Slide out off-screen to the RIGHT (ALWAYS, regardless of language)
        Animated.timing(slideAnim, {
          toValue: DRAWER_WIDTH, // Slide entire 80% drawer off-screen to the right
          duration: 500, // Slower, more controlled slide-out
          easing: Easing.bezier(0.4, 0, 0.6, 1), // Smooth ease-in
          useNativeDriver: true,
        }),
        // Fade out backdrop
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        // Scale down drawer slightly
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 350,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        // Only unmount after animation completes
        if (finished) {
          setShouldRender(false);
        }
      });
    }
  }, [visible, slideAnim, fadeAnim, scaleAnim]);

  // Handle logout with confirmation
  const handleLogout = () => {
    Alert.alert(
      t('account.logout'),
      t('settings.signOutConfirm'), // "Are you sure you want to sign out?"
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('account.logout'),
          style: 'destructive',
          onPress: async () => {
            setIsLoggingOut(true);
            try {
              // 1. Sign out from Supabase
              logger.info('Signing out from Supabase...');
              await authService.signOut();

              // 2. Clear all app state and cached data
              logger.info('Clearing local storage...');
              await clearStorage();

              // 3. Update authentication state (redundant but explicit)
              setAuthenticated(false);

              // 4. Close the drawer
              onClose();

              logger.info('Logout successful');
            } catch (error) {
              logger.error('Logout error:', error);

              // Still clear local state even if Supabase signOut fails
              try {
                await clearStorage();
                setAuthenticated(false);
                onClose();
              } catch (clearError) {
                logger.error('Error clearing storage:', clearError);
                Alert.alert(
                  t('common.error'),
                  'Failed to log out. Please try again.'
                );
              }
            } finally {
              setIsLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  if (!shouldRender) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      {/* Backdrop overlay with fade animation */}
      <Animated.View
        style={[
          styles.backdrop,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
        />
        {/* Drawer container - ALWAYS on right side */}
        <Animated.View
          style={[
            styles.drawer,
            // Removed RTL styling - drawer always slides from right side
            {
              transform: [
                { translateX: slideAnim },
                { scale: scaleAnim },
              ],
            },
          ]}
          onStartShouldSetResponder={() => true}
        >
          {/* Close button */}
          <TouchableOpacity
            style={[styles.closeButton, isRTL && styles.closeButtonRTL]}
            onPress={onClose}
          >
            <Ionicons
              name="close"
              size={FIBONACCI.XL}
              color={COLORS.text}
            />
          </TouchableOpacity>

          {/* Header - User Name */}
          <View style={[styles.header, isRTL && styles.headerRTL]}>
            <View style={styles.avatarCircle}>
              <Ionicons
                name="person"
                size={FIBONACCI.XXL}
                color={COLORS.primary}
              />
            </View>
            <Text style={[styles.userName, isRTL && styles.userNameRTL]}>
              {userName}
            </Text>
          </View>

          {/* Menu Items - Centered */}
          <View style={styles.menuContainer}>
            {/* Logout */}
            <TouchableOpacity
              style={[
                styles.menuItem,
                styles.logoutItem,
                isRTL && styles.menuItemRTL,
                isLoggingOut && styles.disabledItem,
              ]}
              onPress={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                <ActivityIndicator
                  size="small"
                  color={COLORS.error}
                  style={[styles.menuIcon, isRTL && styles.menuIconRTL]}
                />
              ) : (
                <Ionicons
                  name="log-out-outline"
                  size={FIBONACCI.LG}
                  color={COLORS.error}
                  style={[styles.menuIcon, isRTL && styles.menuIconRTL]}
                />
              )}
              <Text style={[styles.menuText, styles.logoutText, isRTL && styles.menuTextRTL]}>
                {isLoggingOut ? t('common.loading') : t('account.logout')}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawer: {
    position: 'absolute',
    right: 0,
    width: DRAWER_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: COLORS.background,
    shadowColor: '#000',
    shadowOffset: {
      width: -2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  drawerRTL: {
    right: undefined,
    left: 0,
    shadowOffset: {
      width: 2,
      height: 0,
    },
  },
  closeButton: {
    position: 'absolute',
    top: FIBONACCI.XXL,
    right: FIBONACCI.LG,
    zIndex: 10,
    padding: FIBONACCI.SM,
  },
  closeButtonRTL: {
    right: undefined,
    left: FIBONACCI.LG,
  },
  header: {
    paddingTop: FIBONACCI.XXXL,
    paddingHorizontal: FIBONACCI.LG,
    paddingBottom: FIBONACCI.XL,
    alignItems: 'flex-start',
  },
  headerRTL: {
    alignItems: 'flex-end',
  },
  avatarCircle: {
    width: FIBONACCI.XXXL,
    height: FIBONACCI.XXXL,
    borderRadius: FIBONACCI.XXXL / 2,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: FIBONACCI.MD,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  userName: {
    fontSize: TYPOGRAPHY.XL,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  userNameRTL: {
    textAlign: 'right',
  },
  menuContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: FIBONACCI.LG,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: FIBONACCI.LG,
    paddingHorizontal: FIBONACCI.MD,
    marginBottom: FIBONACCI.MD,
    borderRadius: FIBONACCI.MD,
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  menuItemRTL: {
    flexDirection: 'row-reverse',
  },
  menuIcon: {
    marginRight: FIBONACCI.MD,
  },
  menuIconRTL: {
    marginRight: 0,
    marginLeft: FIBONACCI.MD,
  },
  menuText: {
    fontSize: TYPOGRAPHY.MD,
    color: COLORS.text,
    fontWeight: '600',
  },
  menuTextRTL: {
    textAlign: 'right',
  },
  logoutItem: {
    marginTop: FIBONACCI.LG,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  logoutText: {
    color: COLORS.error,
  },
  disabledItem: {
    opacity: 0.5,
  },
});
