/**
 * Image Processing Utility
 * Handles optimization and storage of user-captured plant photos
 */

// ✅ FIX: Use legacy FileSystem API to avoid deprecation errors
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { logger } from './logger';

// Configuration (Plant Identification Standards)
const TARGET_WIDTH = 800;  // Max width for optimized images (retina-ready)
const IMAGE_QUALITY = 0.8;  // 80% quality (good balance of quality/size)
const PHOTO_DIR = `${FileSystem.documentDirectory}plant_photos/`;

/**
 * Ensure photo directory exists
 */
async function ensurePhotoDirectory(): Promise<void> {
  const dirInfo = await FileSystem.getInfoAsync(PHOTO_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(PHOTO_DIR, { intermediates: true });
    logger.info('Created plant_photos directory');
  }
}

/**
 * Optimize captured photo for app usage (Plant Identification Standard)
 * - Resizes to max 800px width (maintaining aspect ratio)
 * - Compresses to WebP with 80% quality (lossy compression)
 * - Target size: 30-80KB (smaller than JPEG with better quality)
 *
 * @param photoUri - Original photo URI from camera (captured at 1x optical zoom)
 * @returns Optimized photo URI
 */
export async function optimizePhoto(photoUri: string): Promise<string> {
  try {
    logger.info('Optimizing photo (WebP 800px @ 80%)...', { originalUri: photoUri });

    const result = await ImageManipulator.manipulateAsync(
      photoUri,
      [
        // Resize to max 800px width, maintaining aspect ratio
        { resize: { width: TARGET_WIDTH } }
      ],
      {
        compress: IMAGE_QUALITY,
        format: ImageManipulator.SaveFormat.WEBP,  // WebP for better compression
      }
    );

    logger.info('Photo optimized to WebP', {
      originalUri: photoUri,
      optimizedUri: result.uri,
      width: result.width,
      height: result.height,
    });

    return result.uri;
  } catch (error) {
    logger.error('Failed to optimize photo', { error, photoUri });
    // Return original if optimization fails
    return photoUri;
  }
}

/**
 * Save photo to permanent storage
 * - Creates unique filename with timestamp
 * - Saves to DocumentDirectory/plant_photos/
 * - Returns permanent file URI for database storage
 *
 * @param photoUri - Photo URI to save (should be optimized first)
 * @param userId - User ID for filename uniqueness
 * @returns Permanent file URI
 */
export async function savePhotoToPermanentStorage(
  photoUri: string,
  userId: string = 'user'
): Promise<string> {
  try {
    // Ensure directory exists
    await ensurePhotoDirectory();

    // Generate unique filename (WebP format)
    const timestamp = Date.now();
    const fileName = `plant_photo_${userId}_${timestamp}.webp`;
    const permanentUri = `${PHOTO_DIR}${fileName}`;

    // Copy photo to permanent storage
    await FileSystem.copyAsync({
      from: photoUri,
      to: permanentUri,
    });

    // Get file size for logging
    const fileInfo = await FileSystem.getInfoAsync(permanentUri);
    const fileSizeKB = fileInfo.size ? (fileInfo.size / 1024).toFixed(1) : 'unknown';

    logger.info('Photo saved to permanent storage', {
      fileName,
      permanentUri,
      fileSizeKB: `${fileSizeKB} KB`,
    });

    return permanentUri;
  } catch (error) {
    logger.error('Failed to save photo to permanent storage', { error, photoUri });
    throw error;
  }
}

/**
 * Delete photo from storage
 * Used for cleanup when user deletes a plant
 *
 * @param photoUri - Photo URI to delete
 */
export async function deletePhoto(photoUri: string): Promise<boolean> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(photoUri);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(photoUri);
      logger.info('Photo deleted', { photoUri });
      return true;
    }
    return false;
  } catch (error) {
    logger.error('Failed to delete photo', { error, photoUri });
    return false;
  }
}

/**
 * Get total size of all user photos
 * Useful for storage management
 */
export async function getPhotoStorageSize(): Promise<number> {
  try {
    await ensurePhotoDirectory();
    const files = await FileSystem.readDirectoryAsync(PHOTO_DIR);

    let totalSize = 0;
    for (const file of files) {
      const fileUri = `${PHOTO_DIR}${file}`;
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (fileInfo.size) {
        totalSize += fileInfo.size;
      }
    }

    return totalSize;
  } catch (error) {
    logger.error('Failed to get photo storage size', { error });
    return 0;
  }
}

/**
 * Process and save captured photo
 * Complete workflow: optimize → save → return permanent URI
 *
 * @param capturedPhotoUri - Original photo from camera
 * @param userId - User ID for filename
 * @returns Permanent photo URI for database storage
 */
export async function processCapturedPhoto(
  capturedPhotoUri: string,
  userId: string = 'user'
): Promise<string> {
  logger.info('Processing captured photo...', { capturedPhotoUri });

  // Step 1: Optimize photo (resize + compress)
  const optimizedUri = await optimizePhoto(capturedPhotoUri);

  // Step 2: Save to permanent storage
  const permanentUri = await savePhotoToPermanentStorage(optimizedUri, userId);

  logger.info('Photo processing complete', {
    original: capturedPhotoUri,
    optimized: optimizedUri,
    permanent: permanentUri,
  });

  return permanentUri;
}
