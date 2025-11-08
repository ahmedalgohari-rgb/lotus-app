/**
 * Input Validation and Sanitization Utilities
 *
 * Provides security-focused validation and sanitization for user inputs.
 *
 * Security Benefits:
 * - Prevents malicious file uploads
 * - Validates image dimensions and file sizes
 * - Sanitizes text inputs to prevent injection attacks
 * - Enforces business logic constraints
 */

import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

// =============================================================================
// IMAGE VALIDATION
// =============================================================================

/**
 * Allowed image MIME types for uploads
 */
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

/**
 * Maximum file size in bytes (5MB)
 */
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Maximum image dimensions
 */
export const MAX_IMAGE_WIDTH = 4000;
export const MAX_IMAGE_HEIGHT = 4000;

/**
 * Minimum image dimensions (too small images are likely not useful)
 */
export const MIN_IMAGE_WIDTH = 100;
export const MIN_IMAGE_HEIGHT = 100;

export interface ImageValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fileSize?: number;
  dimensions?: { width: number; height: number };
}

/**
 * Validate an image file for upload
 * Checks file type, size, and dimensions
 */
export async function validateImageForUpload(
  uri: string,
  mimeType?: string
): Promise<ImageValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // 1. Check file exists
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) {
      errors.push('File does not exist');
      return { isValid: false, errors, warnings };
    }

    // 2. Validate MIME type
    if (mimeType && !ALLOWED_IMAGE_TYPES.includes(mimeType.toLowerCase())) {
      errors.push(
        `Invalid file type: ${mimeType}. Allowed types: JPEG, PNG, WebP`
      );
    }

    // 3. Validate file extension
    const extension = uri.split('.').pop()?.toLowerCase();
    const validExtensions = ['jpg', 'jpeg', 'png', 'webp'];
    if (extension && !validExtensions.includes(extension)) {
      errors.push(
        `Invalid file extension: .${extension}. Allowed: ${validExtensions.join(', ')}`
      );
    }

    // 4. Check file size
    const fileSize = 'size' in fileInfo ? fileInfo.size : 0;
    if (fileSize === 0) {
      errors.push('File is empty (0 bytes)');
    } else if (fileSize > MAX_FILE_SIZE) {
      const sizeMB = (fileSize / (1024 * 1024)).toFixed(2);
      const maxSizeMB = (MAX_FILE_SIZE / (1024 * 1024)).toFixed(0);
      errors.push(
        `File too large: ${sizeMB}MB. Maximum size: ${maxSizeMB}MB`
      );
    }

    // 5. Validate image dimensions
    // Note: We can't easily get image dimensions without loading the image
    // The manipulateAsync below is a lightweight way to check this
    try {
      const imageInfo = await manipulateAsync(uri, [], {
        compress: 1,
        format: SaveFormat.JPEG,
      });

      const { width, height } = imageInfo;

      if (width < MIN_IMAGE_WIDTH || height < MIN_IMAGE_HEIGHT) {
        errors.push(
          `Image too small: ${width}x${height}px. Minimum: ${MIN_IMAGE_WIDTH}x${MIN_IMAGE_HEIGHT}px`
        );
      }

      if (width > MAX_IMAGE_WIDTH || height > MAX_IMAGE_HEIGHT) {
        warnings.push(
          `Image is large: ${width}x${height}px. Will be resized to fit ${MAX_IMAGE_WIDTH}x${MAX_IMAGE_HEIGHT}px`
        );
      }

      // Return validation result with metadata
      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        fileSize,
        dimensions: { width, height },
      };
    } catch (imageError) {
      errors.push('Failed to read image. File may be corrupted.');
      return { isValid: false, errors, warnings, fileSize };
    }
  } catch (error) {
    errors.push(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return { isValid: false, errors, warnings };
  }
}

/**
 * Resize image if it exceeds maximum dimensions
 * Returns the resized image URI or original if no resize needed
 */
export async function resizeImageIfNeeded(
  uri: string,
  maxWidth: number = MAX_IMAGE_WIDTH,
  maxHeight: number = MAX_IMAGE_HEIGHT
): Promise<string> {
  try {
    const imageInfo = await manipulateAsync(uri, [], {
      compress: 1,
      format: SaveFormat.JPEG,
    });

    const { width, height } = imageInfo;

    if (width <= maxWidth && height <= maxHeight) {
      return uri; // No resize needed
    }

    // Calculate new dimensions maintaining aspect ratio
    const aspectRatio = width / height;
    let newWidth = width;
    let newHeight = height;

    if (width > maxWidth) {
      newWidth = maxWidth;
      newHeight = maxWidth / aspectRatio;
    }

    if (newHeight > maxHeight) {
      newHeight = maxHeight;
      newWidth = maxHeight * aspectRatio;
    }

    const resized = await manipulateAsync(
      uri,
      [{ resize: { width: Math.round(newWidth), height: Math.round(newHeight) } }],
      { compress: 0.8, format: SaveFormat.JPEG }
    );

    console.log(`✅ Image resized from ${width}x${height} to ${Math.round(newWidth)}x${Math.round(newHeight)}`);
    return resized.uri;
  } catch (error) {
    console.error('Failed to resize image:', error);
    return uri; // Return original if resize fails
  }
}

// =============================================================================
// TEXT INPUT SANITIZATION
// =============================================================================

/**
 * Sanitize text input by trimming whitespace and enforcing length limits
 */
export function sanitizeText(
  text: string,
  options: {
    maxLength?: number;
    minLength?: number;
    allowEmpty?: boolean;
  } = {}
): { value: string; isValid: boolean; error?: string } {
  const { maxLength = 500, minLength = 0, allowEmpty = false } = options;

  // Trim whitespace
  const trimmed = text.trim();

  // Check if empty
  if (!trimmed && !allowEmpty) {
    return { value: '', isValid: false, error: 'Input cannot be empty' };
  }

  // Check minimum length
  if (trimmed.length < minLength) {
    return {
      value: trimmed,
      isValid: false,
      error: `Input must be at least ${minLength} characters`,
    };
  }

  // Check maximum length
  if (trimmed.length > maxLength) {
    return {
      value: trimmed.substring(0, maxLength),
      isValid: false,
      error: `Input exceeds maximum length of ${maxLength} characters`,
    };
  }

  return { value: trimmed, isValid: true };
}

/**
 * Validate plant nickname
 */
export function validatePlantNickname(nickname: string): {
  value: string;
  isValid: boolean;
  error?: string;
} {
  const result = sanitizeText(nickname, {
    maxLength: 100,
    minLength: 1,
    allowEmpty: false,
  });

  // Additional validation: Check for valid characters
  if (result.isValid && !/^[a-zA-Z0-9\s\u0600-\u06FF\-_.,']+$/.test(result.value)) {
    return {
      value: result.value,
      isValid: false,
      error: 'Nickname contains invalid characters',
    };
  }

  return result;
}

/**
 * Validate plant notes
 */
export function validatePlantNotes(notes: string): {
  value: string;
  isValid: boolean;
  error?: string;
} {
  return sanitizeText(notes, {
    maxLength: 1000,
    allowEmpty: true,
  });
}

// =============================================================================
// URL VALIDATION
// =============================================================================

/**
 * Validate a URL string
 * Ensures it's a valid HTTP/HTTPS URL
 */
export function validateUrl(url: string): {
  isValid: boolean;
  error?: string;
} {
  try {
    const parsed = new URL(url);

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return {
        isValid: false,
        error: 'URL must use HTTP or HTTPS protocol',
      };
    }

    return { isValid: true };
  } catch (error) {
    return { isValid: false, error: 'Invalid URL format' };
  }
}

// =============================================================================
// ENUM VALIDATION
// =============================================================================

/**
 * Validate a value against an allowed list of options
 */
export function validateEnum<T extends string>(
  value: T,
  allowedValues: readonly T[],
  fieldName: string = 'Value'
): { isValid: boolean; error?: string } {
  if (!allowedValues.includes(value)) {
    return {
      isValid: false,
      error: `${fieldName} must be one of: ${allowedValues.join(', ')}`,
    };
  }

  return { isValid: true };
}

/**
 * Validate plant location
 */
export const PLANT_LOCATIONS = [
  'living_room',
  'bedroom',
  'kitchen',
  'bathroom',
  'balcony',
] as const;

export function validatePlantLocation(location: string): {
  isValid: boolean;
  error?: string;
} {
  return validateEnum(location as any, PLANT_LOCATIONS, 'Location');
}

/**
 * Validate window direction
 */
export const WINDOW_DIRECTIONS = ['north', 'east', 'south', 'west'] as const;

export function validateWindowDirection(direction: string): {
  isValid: boolean;
  error?: string;
} {
  return validateEnum(direction as any, WINDOW_DIRECTIONS, 'Window direction');
}

/**
 * Validate health status
 */
export const HEALTH_STATUSES = [
  'healthy',
  'needs_attention',
  'critical',
] as const;

export function validateHealthStatus(status: string): {
  isValid: boolean;
  error?: string;
} {
  return validateEnum(status as any, HEALTH_STATUSES, 'Health status');
}
