import { S3Client, PutObjectCommand, DeleteObjectCommand, PutObjectCommandInput, DeleteObjectCommandInput } from '@aws-sdk/client-s3';
import { Logger } from '../utils/logger';

class SpacesService {
    private s3Client: S3Client;
    private bucket: string;
    private cdnEndpoint: string;

    constructor() {
        const endpoint = process.env.DO_SPACES_ENDPOINT || 'https://sgp1.digitaloceanspaces.com';
        const region = process.env.DO_SPACES_REGION || 'sgp1';
        this.bucket = process.env.DO_SPACES_BUCKET || '';
        this.cdnEndpoint = process.env.DO_SPACES_CDN_ENDPOINT || '';

        if (!this.bucket) {
            Logger.warn('DO_SPACES_BUCKET not configured - image upload will fail');
        }

        this.s3Client = new S3Client({
            endpoint,
            region,
            credentials: {
                accessKeyId: process.env.DO_SPACES_ACCESS_KEY || '',
                secretAccessKey: process.env.DO_SPACES_SECRET_KEY || '',
            },
        });

        Logger.info('DigitalOcean Spaces client initialized', { bucket: this.bucket, region });
    }

    async uploadImage(buffer: Buffer, key: string, contentType: string = 'image/png'): Promise<string> {
        try {
            const params: PutObjectCommandInput = {
                Bucket: this.bucket,
                Key: key,
                Body: buffer,
                ACL: 'public-read',
                ContentType: contentType,
            };

            const command = new PutObjectCommand(params);
            await this.s3Client.send(command);

            const imageUrl = this.cdnEndpoint
                ? `${this.cdnEndpoint}/${key}`
                : `https://${this.bucket}.${process.env.DO_SPACES_REGION}.digitaloceanspaces.com/${key}`;

            Logger.info('Image uploaded successfully', { key, url: imageUrl });
            return imageUrl;
        } catch (error) {
            Logger.error('Failed to upload image to Spaces', { error, key });
            throw error;
        }
    }

    async deleteImage(key: string): Promise<void> {
        try {
            const params: DeleteObjectCommandInput = {
                Bucket: this.bucket,
                Key: key,
            };

            const command = new DeleteObjectCommand(params);
            await this.s3Client.send(command);

            Logger.info('Image deleted successfully', { key });
        } catch (error) {
            Logger.error('Failed to delete image from Spaces', { error, key });
            throw error;
        }
    }
}

export const spacesService = new SpacesService();
