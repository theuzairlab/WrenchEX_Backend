import imagekit from '../config/imagekit';
import { v4 as uuidv4 } from 'uuid';

export class UploadService {
  // Upload image to ImageKit
  static async uploadImage(
    file: string | Buffer, // base64 string or buffer
    fileName: string,
    folder?: string,
    tags?: string[]
  ) {
    try {
      // Generate unique filename
      const uniqueFileName = `${uuidv4()}-${fileName}`;
      
      const uploadResponse = await imagekit.upload({
        file,
        fileName: uniqueFileName,
        folder: folder || 'wrenchex',
        tags: tags || ['wrenchex'],
        useUniqueFileName: false, // We're already making it unique
        transformation: {
          pre: 'l-text,i-WrenchEX,fs-20,l-end', // Add watermark
          post: [
            {
              type: 'transformation',
              value: 'w-800,h-600,c-maintain_ratio' // Optimize size
            }
          ]
        }
      });

      return {
        fileId: uploadResponse.fileId,
        name: uploadResponse.name,
        url: uploadResponse.url,
        thumbnailUrl: (uploadResponse as any).thumbnailUrl || uploadResponse.url,
        size: uploadResponse.size,
        filePath: uploadResponse.filePath,
        tags: uploadResponse.tags
      };
    } catch (error) {
      console.error('ImageKit upload error:', error);
      throw new Error('Failed to upload image');
    }
  }

  // Upload multiple images
  static async uploadMultipleImages(
    files: Array<{ file: string | Buffer; fileName: string }>,
    folder?: string,
    tags?: string[]
  ) {
    try {
      const uploadPromises = files.map((fileData, index) => 
        this.uploadImage(
          fileData.file, 
          fileData.fileName, 
          folder, 
          [...(tags || []), `batch-${uuidv4()}`]
        )
      );

      const results = await Promise.all(uploadPromises);
      return results;
    } catch (error) {
      console.error('Multiple image upload error:', error);
      throw new Error('Failed to upload images');
    }
  }

  // Delete image from ImageKit
  static async deleteImage(fileId: string) {
    try {
      await imagekit.deleteFile(fileId);
      return { message: 'Image deleted successfully' };
    } catch (error) {
      console.error('ImageKit delete error:', error);
      throw new Error('Failed to delete image');
    }
  }

  // Delete multiple images
  static async deleteMultipleImages(fileIds: string[]) {
    try {
      const deletePromises = fileIds.map(fileId => imagekit.deleteFile(fileId));
      await Promise.all(deletePromises);
      return { message: `${fileIds.length} images deleted successfully` };
    } catch (error) {
      console.error('Multiple image delete error:', error);
      throw new Error('Failed to delete images');
    }
  }

  // Get image details
  static async getImageDetails(fileId: string) {
    try {
      const fileDetails = await imagekit.getFileDetails(fileId);
      return {
        fileId: fileDetails.fileId,
        name: fileDetails.name,
        url: fileDetails.url,
        thumbnailUrl: (fileDetails as any).thumbnail || fileDetails.url,
        size: fileDetails.size,
        filePath: fileDetails.filePath,
        tags: fileDetails.tags,
        createdAt: fileDetails.createdAt,
        updatedAt: fileDetails.updatedAt
      };
    } catch (error) {
      console.error('ImageKit get details error:', error);
      throw new Error('Failed to get image details');
    }
  }

  // Generate authentication parameters for client-side upload
  static generateAuthenticationParameters(token?: string, expire?: number) {
    try {
      const authParams = imagekit.getAuthenticationParameters(token, expire);
      return authParams;
    } catch (error) {
      console.error('ImageKit auth params error:', error);
      throw new Error('Failed to generate authentication parameters');
    }
  }

  // Transform image URL (resize, crop, etc.)
  static transformImageUrl(
    imageUrl: string,
    transformations: Array<{
      height?: number;
      width?: number;
      cropMode?: string;
      quality?: number;
      format?: string;
    }>
  ) {
    try {
      const transformedUrl = imagekit.url({
        src: imageUrl,
        transformation: transformations
      });
      return transformedUrl;
    } catch (error) {
      console.error('ImageKit transform error:', error);
      throw new Error('Failed to transform image URL');
    }
  }

  // Validate file type and size
  static validateFile(file: any, maxSizeMB = 5, allowedTypes = ['image/jpeg', 'image/png', 'image/webp']) {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    if (!file) {
      throw new Error('No file provided');
    }

    if (file.size > maxSizeBytes) {
      throw new Error(`File size must be less than ${maxSizeMB}MB`);
    }

    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error(`File type must be one of: ${allowedTypes.join(', ')}`);
    }

    return true;
  }

  // Convert base64 to buffer
  static base64ToBuffer(base64String: string) {
    try {
      // Remove data URL prefix if present
      const base64Data = base64String.replace(/^data:image\/[a-z]+;base64,/, '');
      return Buffer.from(base64Data, 'base64');
    } catch (error) {
      throw new Error('Invalid base64 string');
    }
  }

  // Generate thumbnail URL
  static generateThumbnail(imageUrl: string, width = 300, height = 300) {
    return this.transformImageUrl(imageUrl, [
      {
        width,
        height,
        cropMode: 'maintain_ratio',
        quality: 80,
        format: 'webp'
      }
    ]);
  }

  // Bulk operations for product images
  static async uploadProductImages(
    images: Array<{ file: string | Buffer; fileName: string }>,
    productId: string
  ) {
    const folder = `wrenchex/products/${productId}`;
    const tags = ['product', 'wrenchex', productId];

    return this.uploadMultipleImages(images, folder, tags);
  }

  // Upload seller shop images
  static async uploadShopImages(
    images: Array<{ file: string | Buffer; fileName: string }>,
    sellerId: string
  ) {
    const folder = `wrenchex/shops/${sellerId}`;
    const tags = ['shop', 'seller', 'wrenchex', sellerId];

    return this.uploadMultipleImages(images, folder, tags);
  }

  // Upload category images
  static async uploadCategoryImage(
    file: string | Buffer,
    fileName: string,
    categoryId: string
  ) {
    const folder = `wrenchex/categories`;
    const tags = ['category', 'wrenchex', categoryId];

    return this.uploadImage(file, fileName, folder, tags);
  }
} 