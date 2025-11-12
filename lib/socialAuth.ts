/**
 * Social Authentication Service
 * Handles Apple Sign-In and Google Sign-In
 */

import * as AppleAuthentication from 'expo-apple-authentication';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { supabase } from './supabase';
import { createLogger } from './logger';

const logger = createLogger('SocialAuth');

// Complete discovery for proper session cleanup
WebBrowser.maybeCompleteAuthSession();

// Google OAuth Configuration
// TODO: Add your Google OAuth Client IDs to .env
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;

export interface AuthResult {
  success: boolean;
  error?: string;
  user?: any;
}

/**
 * Apple Sign-In
 * iOS only - falls back to web OAuth on Android
 */
export async function signInWithApple(): Promise<AuthResult> {
  try {
    logger.info('Starting Apple Sign-In...');

    // Check if Apple Sign-In is available (iOS only)
    const isAvailable = await AppleAuthentication.isAvailableAsync();

    if (!isAvailable) {
      logger.warn('Apple Sign-In not available on this device');
      return {
        success: false,
        error: 'Apple Sign-In אינו זמין במכשיר זה. זמין רק ב-iOS.'
      };
    }

    // Request Apple Sign-In
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    logger.info('Apple Sign-In successful, exchanging token...');

    // Sign in with Supabase using Apple ID token
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken!,
      nonce: credential.user,
    });

    if (error) {
      logger.error('Supabase Apple auth error:', error);
      return {
        success: false,
        error: 'שגיאה בהתחברות עם Apple. אנא נסה שוב.'
      };
    }

    logger.info('Apple Sign-In completed successfully');

    return {
      success: true,
      user: data.user
    };

  } catch (error: any) {
    logger.error('Apple Sign-In error:', error);

    if (error.code === 'ERR_REQUEST_CANCELED') {
      return {
        success: false,
        error: 'ההתחברות בוטלה'
      };
    }

    return {
      success: false,
      error: 'שגיאה בהתחברות עם Apple'
    };
  }
}

/**
 * Google Sign-In
 * Uses expo-auth-session for cross-platform support
 */
export async function signInWithGoogle(): Promise<AuthResult> {
  try {
    logger.info('Starting Google Sign-In...');

    // Verify Google OAuth configuration
    if (!GOOGLE_WEB_CLIENT_ID && !GOOGLE_IOS_CLIENT_ID && !GOOGLE_ANDROID_CLIENT_ID) {
      logger.error('Missing Google OAuth Client IDs');
      return {
        success: false,
        error: 'Google Sign-In אינו מוגדר כראוי. אנא צור קשר עם התמיכה.'
      };
    }

    // Use hook for Google authentication
    const [request, response, promptAsync] = Google.useAuthRequest({
      webClientId: GOOGLE_WEB_CLIENT_ID,
      iosClientId: GOOGLE_IOS_CLIENT_ID,
      androidClientId: GOOGLE_ANDROID_CLIENT_ID,
      scopes: ['profile', 'email'],
    });

    if (!request) {
      return {
        success: false,
        error: 'שגיאה בהתחברות עם Google'
      };
    }

    // Prompt for Google Sign-In
    const result = await promptAsync();

    if (result.type === 'cancel') {
      logger.info('Google Sign-In cancelled by user');
      return {
        success: false,
        error: 'ההתחברות בוטלה'
      };
    }

    if (result.type !== 'success') {
      logger.error('Google Sign-In failed:', result);
      return {
        success: false,
        error: 'שגיאה בהתחברות עם Google'
      };
    }

    logger.info('Google Sign-In successful, exchanging token...');

    // Exchange access token with Supabase
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: result.params.id_token || result.authentication?.idToken!,
    });

    if (error) {
      logger.error('Supabase Google auth error:', error);
      return {
        success: false,
        error: 'שגיאה בהתחברות עם Google. אנא נסה שוב.'
      };
    }

    logger.info('Google Sign-In completed successfully');

    return {
      success: true,
      user: data.user
    };

  } catch (error: any) {
    logger.error('Google Sign-In error:', error);
    return {
      success: false,
      error: 'שגיאה בהתחברות עם Google'
    };
  }
}

/**
 * Alternative Google Sign-In using @react-native-google-signin
 * (More native implementation - requires more configuration)
 */
export async function signInWithGoogleNative(): Promise<AuthResult> {
  try {
    // This would use @react-native-google-signin/google-signin
    // Requires additional native configuration in ios/ and android/
    // Implementation left as TODO if web OAuth doesn't meet requirements

    logger.warn('Native Google Sign-In not implemented yet');
    return {
      success: false,
      error: 'Native Google Sign-In not configured'
    };
  } catch (error) {
    logger.error('Native Google Sign-In error:', error);
    return {
      success: false,
      error: 'שגיאה בהתחברות עם Google'
    };
  }
}

/**
 * Check if biometric authentication is available
 */
export async function isBiometricAvailable(): Promise<boolean> {
  // This would integrate with expo-local-authentication
  // Left as TODO for future implementation
  return false;
}

/**
 * Sign in with biometric authentication
 */
export async function signInWithBiometric(): Promise<AuthResult> {
  // This would use expo-local-authentication for Face ID/Touch ID/Fingerprint
  // Stores and retrieves credentials securely using expo-secure-store
  // Left as TODO for future implementation

  return {
    success: false,
    error: 'אימות ביומטרי אינו מוגדר עדיין'
  };
}
