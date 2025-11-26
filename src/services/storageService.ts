import { spacesService } from '../config/spaces';
import { Logger } from '../utils/logger';

export class StorageService {
    async uploadImage(buffer: Buffer, fileName: string): Promise<{ url: string; key: string }> {
        try {
            const timestamp = Date.now();
            const key = `images/${timestamp}-${fileName}`;

            const url = await spacesService.uploadImage(buffer, key, 'image/png');

            return { url, key };
        } catch (error) {
            Logger.error('Failed to upload image', { error, fileName });
            throw new Error('Failed to upload image to storage');
        }
    }

    async deleteImage(key: string): Promise<void> {
        try {
            await spacesService.deleteImage(key);
        } catch (error) {
            Logger.error('Failed to delete image', { error, key });
            throw new Error('Failed to delete image from storage');
        }
    }
}

export const storageService = new StorageService();
