import { S3Client, PutObjectCommand, DeleteObjectCommand, PutObjectCommandInput, DeleteObjectCommandInput } from '@aws-sdk/client-s3';
import { Logger } from '../utils/logger';
import dotenv from 'dotenv';
dotenv.config();

// Module-level Spaces client (functional style)
const endpoint = process.env.DO_SPACES_ENDPOINT || 'https://sgp1.digitaloceanspaces.com';
const region = process.env.DO_SPACES_REGION || 'sgp1';
let bucket: string = process.env.DO_SPACES_BUCKET || '';
let cdnEndpoint: string = process.env.DO_SPACES_CDN_ENDPOINT || '';

if (!bucket) {
    Logger.warn('DO_SPACES_BUCKET not configured - image upload will fail');
}

const s3Client = new S3Client({
    endpoint,
    region,
    credentials: {
        accessKeyId: process.env.DO_SPACES_ACCESS_KEY || '',
        secretAccessKey: process.env.DO_SPACES_SECRET_KEY || '',
    },
});

Logger.info('DigitalOcean Spaces client initialized', { bucket, region });

async function uploadImage(buffer: Buffer, key: string, contentType: string = 'image/png'): Promise<string> {
    try {
        const params: PutObjectCommandInput = {
            Bucket: bucket,
            Key: key,
            Body: buffer,
            ACL: 'public-read',
            ContentType: contentType,
        };

        const command = new PutObjectCommand(params);
        await s3Client.send(command);

        const imageUrl = cdnEndpoint
            ? `${cdnEndpoint}/${key}`
            : `https://${bucket}.${process.env.DO_SPACES_REGION}.digitaloceanspaces.com/${key}`;

        Logger.info('Image uploaded successfully', { key, url: imageUrl });
        return imageUrl;
    } catch (error) {
        Logger.error('Failed to upload image to Spaces', { error, key });
        throw error;
    }
}

async function deleteImage(key: string): Promise<void> {
    try {
        const params: DeleteObjectCommandInput = {
            Bucket: bucket,
            Key: key,
        };

        const command = new DeleteObjectCommand(params);
        await s3Client.send(command);

        Logger.info('Image deleted successfully', { key });
    } catch (error) {
        Logger.error('Failed to delete image from Spaces', { error, key });
        throw error;
    }
}

export const spacesService = { uploadImage, deleteImage };
