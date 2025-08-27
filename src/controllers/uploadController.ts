import { Request, Response } from 'express';
import { UploadService } from '../services/uploadService';
import { ApiResponse } from '../types';
import { validateRequest, uploadValidation } from '../utils/validators';

export class UploadController {
  // POST /api/upload/image - Upload single image
  static async uploadImage(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        const response: ApiResponse = {
          success: false,
          error: { message: 'User not authenticated' }
        };
        res.status(401).json(response);
        return;
      }

      // Validate request data
      const validatedData = validateRequest(uploadValidation, req.body);
      const { file, fileName, folder, tags } = validatedData;

      // Upload image
      const result = await UploadService.uploadImage(file, fileName, folder, tags);

      const response: ApiResponse = {
        success: true,
        data: {
          image: result,
          message: 'Image uploaded successfully'
        }
      };

      res.status(201).json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to upload image'
        }
      };
      res.status(400).json(response);
    }
  }

  // POST /api/upload/images - Upload multiple images
  static async uploadMultipleImages(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        const response: ApiResponse = {
          success: false,
          error: { message: 'User not authenticated' }
        };
        res.status(401).json(response);
        return;
      }

      const { files, folder, tags } = req.body;

      if (!files || !Array.isArray(files)) {
        const response: ApiResponse = {
          success: false,
          error: { message: 'Files array is required' }
        };
        res.status(400).json(response);
        return;
      }

      // Validate file count
      if (files.length > 10) {
        const response: ApiResponse = {
          success: false,
          error: { message: 'Maximum 10 files allowed per upload' }
        };
        res.status(400).json(response);
        return;
      }

      // Upload images
      const results = await UploadService.uploadMultipleImages(files, folder, tags);

      const response: ApiResponse = {
        success: true,
        data: {
          images: results,
          count: results.length,
          message: `${results.length} images uploaded successfully`
        }
      };

      res.status(201).json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to upload images'
        }
      };
      res.status(400).json(response);
    }
  }

  // GET /api/upload/auth - Get ImageKit auth parameters
  static async getAuthParameters(req: Request, res: Response): Promise<void> {
    try {
      const authParams = UploadService.generateAuthenticationParameters();

      const response: ApiResponse = {
        success: true,
        data: authParams
      };

      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to generate auth parameters'
        }
      };
      res.status(500).json(response);
    }
  }

  // GET /api/upload/:fileId - Get image details
  static async getImageDetails(req: Request, res: Response): Promise<void> {
    try {
      const { fileId } = req.params;
      const details = await UploadService.getImageDetails(fileId);

      const response: ApiResponse = {
        success: true,
        data: { image: details }
      };

      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Image not found'
        }
      };
      res.status(404).json(response);
    }
  }

  // DELETE /api/upload/:fileId - Delete image
  static async deleteImage(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        const response: ApiResponse = {
          success: false,
          error: { message: 'User not authenticated' }
        };
        res.status(401).json(response);
        return;
      }

      const { fileId } = req.params;
      const result = await UploadService.deleteImage(fileId);

      const response: ApiResponse = {
        success: true,
        data: result
      };

      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to delete image'
        }
      };
      res.status(400).json(response);
    }
  }

  // DELETE /api/upload/batch - Delete multiple images (Admin only)
  static async deleteMultipleImages(req: Request, res: Response): Promise<void> {
    try {
      const { fileIds } = req.body;

      if (!fileIds || !Array.isArray(fileIds)) {
        const response: ApiResponse = {
          success: false,
          error: { message: 'File IDs array is required' }
        };
        res.status(400).json(response);
        return;
      }

      const result = await UploadService.deleteMultipleImages(fileIds);

      const response: ApiResponse = {
        success: true,
        data: result
      };

      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to delete images'
        }
      };
      res.status(400).json(response);
    }
  }
} 