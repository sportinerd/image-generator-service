import { imageGenerator } from './imageGenerator';
import { storageService } from './storageService';
import { ImageRequest } from '../types';
import { Logger } from '../utils/logger';

/**
 * Orchestrates the image generation and upload process.
 */
export const imageProcessingService = {
    /**
     * Generates an image and uploads it to storage.
     */
    async generateAndUpload(imageData: ImageRequest): Promise<{ url: string; key: string }> {
        // Get dimensions from env or use defaults
        const width = parseInt(process.env.IMAGE_WIDTH || '900', 10);
        const height = parseInt(process.env.IMAGE_HEIGHT || '900', 10);

        // Generate image buffer using Puppeteer
        const imageBuffer = await imageGenerator.generateImage(imageData, width, height);

        // Create filename
        const fileName = `${imageData.type}-${imageData.id || Date.now()}.png`;

        // Upload to DigitalOcean Spaces
        Logger.info('Uploading generated image', { fileName });
        const { url, key } = await storageService.uploadImage(imageBuffer, fileName);

        return { url, key };
    }
};
