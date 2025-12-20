import { Request, Response } from 'express';
import { imageGenerator } from '../services/imageGenerator';
import { storageService } from '../services/storageService';
import { dataService } from '../services/data.service';
import { Image } from '../models/Image';
import { Logger } from '../utils/logger';
import { EventImageRequest, GenerateImageResponse, DeleteImageResponse, ErrorResponse } from '../types';

/**
 * Controller for handling image-related API requests
 */
export const imageController = {
    /**
     * Handles image generation requests
     */
    async generateImage(req: Request, res: Response): Promise<void> {
        try {
            const { event_id, event_type, fixture_id }: EventImageRequest = req.body;

            // Validate request data
            if (!event_type) {
                res.status(400).json({
                    success: false,
                    error: 'Bad Request',
                    message: 'event_type is required',
                } as ErrorResponse);
                return;
            }

            // Logic: Only proceed if event_type is 'GOAL'
            // Using case-insensitive check for reliability
            if (event_type.toUpperCase() !== 'GOAL') {
                Logger.info('Event type is not GOAL, skipping image generation', { event_type });
                res.status(200).json({
                    success: true,
                    message: 'Process skipped: only GOAL events trigger image generation',
                });
                return;
            }

            Logger.info('Generating image for event', { event_id, fixture_id });

            // Fetch detailed image data using the data service
            const imageData = await dataService.fetchImageData(event_id, event_type, fixture_id);

            // Generate Caption
            const generateCaption = (data: typeof imageData): string => {
                const { title, gw, data: goalData } = data;
                const { team_win, home_team, away_team, scorers } = goalData;

                let caption = `${title || 'GOAL!'} ⚽\n\n`;

                if (scorers && scorers.length > 0) {
                    const latestScorer = scorers[scorers.length - 1];
                    caption += `${latestScorer.name} (${latestScorer.minute}') finds the net! 🔥\n`;
                } else {
                    caption += `${team_win} scores! 🔥\n`;
                }

                caption += `\n${home_team.name} vs ${away_team.name}\n`;
                caption += `GW ${gw} • ${goalData.club_name || 'Premier League'}\n\n`;

                const teamHashtag = team_win.replace(/\s+/g, '');
                caption += `#${teamHashtag} #PremierLeague #Goal #Football`;

                return caption;
            };

            const caption = generateCaption(imageData);

            // Get dimensions from env or use defaults
            const width = parseInt(process.env.IMAGE_WIDTH || '900', 10);
            const height = parseInt(process.env.IMAGE_HEIGHT || '900', 10);

            // Generate image buffer using Puppeteer
            const imageBuffer = await imageGenerator.generateImage(imageData, width, height);

            // Create filename
            const fileName = `${imageData.type}-${imageData.id || Date.now()}.png`;

            // Upload to DigitalOcean Spaces
            const { url, key } = await storageService.uploadImage(imageBuffer, fileName);

            // Save record to database
            const imageDoc = new Image({
                imageKey: key,
                url,
                type: imageData.type,
                metadata: {
                    id: imageData.id,
                    title: imageData.title,
                    gw: imageData.gw,
                    caption,
                },
            });
            await imageDoc.save();

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
    },

    /**
     * Fetches a list of generated images
     */
    async listImages(req: Request, res: Response): Promise<void> {
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
    }
};
