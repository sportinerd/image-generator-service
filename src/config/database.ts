import mongoose from 'mongoose';
import { Logger } from '../utils/logger';

export const connectDatabase = async (): Promise<void> => {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/image-service';

        await mongoose.connect(mongoUri);

        Logger.info('MongoDB connected successfully', { uri: mongoUri.replace(/\/\/.*@/, '//***@') });

        mongoose.connection.on('error', (error) => {
            Logger.error('MongoDB connection error', { error: error.message });
        });

        mongoose.connection.on('disconnected', () => {
            Logger.warn('MongoDB disconnected');
        });

    } catch (error) {
        Logger.error('Failed to connect to MongoDB', { error });
        throw error;
    }
};

export const disconnectDatabase = async (): Promise<void> => {
    try {
        await mongoose.connection.close();
        Logger.info('MongoDB connection closed');
    } catch (error) {
        Logger.error('Error closing MongoDB connection', { error });
        throw error;
    }
};
