import * as ImageManipulator from 'expo-image-manipulator';
import api from '../api/api';

interface PlantIdentificationResult {
  success: boolean;
  data?: any; // Replace with actual PlantNet API response type
  error?: string;
}

class PlantIdentificationService {
  private PLANT_IDENTIFICATION_ENDPOINT = '/plants/identify';

  /**
   * Compresses and uploads an image for plant identification.
   * @param imageUri The URI of the image to upload.
   * @returns A promise that resolves to the identification result.
   */
  async identifyPlant(imageUri: string): Promise<PlantIdentificationResult> {
    try {
      // 1. Compress Image
      const compressedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: 800 } }], // Resize to a max width of 800px
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG, base64: false }
      );

      if (!compressedImage.uri) {
        return { success: false, error: 'Failed to compress image.' };
      }

      // 2. Prepare FormData for upload
      const formData = new FormData();
      formData.append('image', {
        uri: compressedImage.uri,
        name: 'plant_image.jpg',
        type: 'image/jpeg',
      } as any);

      // 3. Upload to backend
      const response = await api.post(this.PLANT_IDENTIFICATION_ENDPOINT, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        return { success: true, data: response.data.result };
      } else {
        return { success: false, error: response.data.message || 'Identification failed.' };
      }
    } catch (error) {
      console.error('Plant identification error:', error);
      return { success: false, error: 'An error occurred during plant identification.' };
    }
  }
}

export const plantIdentificationService = new PlantIdentificationService();
export default plantIdentificationService;
