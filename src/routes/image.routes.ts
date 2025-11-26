import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { imageGenerator } from '../services/imageGenerator';
import { storageService } from '../services/storageService';
import { Image } from '../models/Image';
import { Logger } from '../utils/logger';
import { ImageRequest, GenerateImageResponse, DeleteImageResponse, ErrorResponse } from '../types';

const router = Router();

// Generate image route
router.post('/generate', authMiddleware, async (req: Request, res: Response) => {
    try {
        const data: ImageRequest = req.body;

        // Validate request data
        if (!data || !data.type || !data.data) {
            res.status(400).json({
                success: false,
                error: 'Bad Request',
                message: 'Invalid request data. Required fields: type, data',
            } as ErrorResponse);
            return;
        }

        Logger.info('Generating image', { type: data.type, id: data.id });

        // Get dimensions from env or use defaults
        const width = parseInt(process.env.IMAGE_WIDTH || '1200', 10);
        const height = parseInt(process.env.IMAGE_HEIGHT || '630', 10);

        // Generate image
        const imageBuffer = await imageGenerator.generateImage(data, width, height);

        // Create filename
        const fileName = `${data.type}-${data.id || Date.now()}.png`;

        // Upload to DigitalOcean Spaces
        const { url, key } = await storageService.uploadImage(imageBuffer, fileName);

        // Save to database
        const imageDoc = new Image({
            imageKey: key,
            url,
            type: data.type,
            metadata: {
                id: data.id,
                title: data.title,
                gw: data.gw,
            },
        });
        await imageDoc.save();

        Logger.info('Image generated and uploaded successfully', { key, url });

        res.status(200).json({
            success: true,
            imageUrl: url,
            imageKey: key,
            message: 'Image generated and uploaded successfully',
        } as GenerateImageResponse);
    } catch (error: any) {
        Logger.error('Error generating image', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Internal Server Error',
            message: error.message || 'Failed to generate image',
        } as ErrorResponse);
    }
});

// Delete image route
router.delete('/:imageKey(*)', authMiddleware, async (req: Request, res: Response) => {
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

        // Delete from database
        await Image.deleteOne({ imageKey });

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
});

// Get all images (optional, for debugging)
router.get('/', authMiddleware, async (req: Request, res: Response) => {
    try {
        const images = await Image.find().sort({ createdAt: -1 }).limit(50);
        res.status(200).json({
            success: true,
            count: images.length,
            images,
        });
    } catch (error: any) {
        Logger.error('Error fetching images', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Internal Server Error',
            message: error.message || 'Failed to fetch images',
        } as ErrorResponse);
    }
});

export default router;
