import { Request, Response } from 'express';
import { imageProcessingService } from '../services/imageProcessing.service';
import { dataService } from '../services/data.service';
import { Logger } from '../utils/logger';
import { generateCaption } from '../utils/captionHelper';
import { EventImageRequest, GenerateImageResponse, DeleteImageResponse, ErrorResponse } from '../types';
import { storageService } from '../services/storageService';
import { validateGenerateImageRequest } from '../utils/validator';

/**
 * Controller for handling image-related API requests
 */
export const imageController = {
    /**
     * Handles image generation requests
     */
    async generateImage(req: Request, res: Response): Promise<void> {
        try {
            const validation = validateGenerateImageRequest(req.body);

            if (!validation.isValid || !validation.data) {
                res.status(validation.error!.status).json({
                    success: false,
                    error: validation.error!.error,
                    message: validation.error!.message,
                } as ErrorResponse);
                return;
            }

            const { event_id, event_type, fixture_id } = validation.data;

            Logger.info('Generating image for event', { event_id, fixture_id });

            // Fetch detailed image data using the data service
            const imageData = await dataService.fetchImageData({
                eventId: event_id,
                eventType: event_type,
                fixtureId: fixture_id
            });

            // Generate Caption
            const caption = generateCaption(imageData);

            // Generate image and upload
            const { url, key } = await imageProcessingService.generateAndUpload(imageData);

            Logger.info('Image generated and uploaded successfully', { key, url });

            res.status(200).json({
                success: true,
                imageUrl: url,
                imageKey: key,
                caption,
                message: 'Image generated and uploaded successfully',
            } as GenerateImageResponse);

        } catch (error: any) {
            Logger.error('Error in image generation controller', { error: error.message });
            res.status(500).json({
                success: false,
                error: 'Internal Server Error',
                message: error.message || 'Failed to generate image',
            } as ErrorResponse);
        }
    },

    /**
     * Handles image deletion requests
     */
    async deleteImage(req: Request, res: Response): Promise<void> {
        try {
            const { imageKey } = req.params;

            if (!imageKey) {
                res.status(400).json({
                    success: false,
                    error: 'Bad Request',
                    message: 'imageKey parameter is required',
                } as ErrorResponse);
                return;
            }

            Logger.info('Deleting image', { imageKey });

            // Delete from DigitalOcean Spaces
            await storageService.deleteImage(imageKey);

            Logger.info('Image deleted successfully', { imageKey });

            res.status(200).json({
                success: true,
                message: 'Image deleted successfully',
            } as DeleteImageResponse);
        } catch (error: any) {
            Logger.error('Error deleting image', { error: error.message });
            res.status(500).json({
                success: false,
                error: 'Internal Server Error',
                message: error.message || 'Failed to delete image',
            } as ErrorResponse);
        }
    },
};
