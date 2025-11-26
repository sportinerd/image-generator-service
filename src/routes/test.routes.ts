import { Router, Request, Response } from 'express';
import { imageGenerator } from '../services/imageGenerator';
import { Logger } from '../utils/logger';
import { ImageRequest } from '../types';
import * as fs from 'fs';
import * as path from 'path';

const router = Router();

// Test route - generate image and save locally
router.post('/test-generate', async (req: Request, res: Response) => {
    try {
        const data: ImageRequest = req.body;

        // Validate request data
        if (!data || !data.type || !data.data) {
            res.status(400).json({
                success: false,
                error: 'Bad Request',
                message: 'Invalid request data. Required fields: type, data',
            });
            return;
        }

        Logger.info('Generating test image', { type: data.type, id: data.id });

        // Get dimensions from env or use defaults
        const width = parseInt(process.env.IMAGE_WIDTH || '1200', 10);
        const height = parseInt(process.env.IMAGE_HEIGHT || '630', 10);

        // Generate image
        const imageBuffer = await imageGenerator.generateImage(data, width, height);

        // Create output directory
        const outputDir = path.join(process.cwd(), 'output');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Save locally
        const fileName = `${data.type}-${data.id || Date.now()}.png`;
        const filePath = path.join(outputDir, fileName);
        fs.writeFileSync(filePath, imageBuffer);

        Logger.info('Test image generated and saved locally', { filePath });

        res.status(200).json({
            success: true,
            message: 'Image generated and saved locally',
            filePath,
            fileName,
        });
    } catch (error: any) {
        Logger.error('Error generating test image', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Internal Server Error',
            message: error.message || 'Failed to generate image',
        });
    }
});

export default router;
