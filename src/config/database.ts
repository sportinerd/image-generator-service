import mongoose from 'mongoose';
import { Logger } from '../utils/logger';

export const connectDatabase = async (): Promise<void> => {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/image-service';

        const options = {
            autoIndex: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        };

        await mongoose.connect(mongoUri, options);

        Logger.info('MongoDB connected successfully');

        mongoose.connection.on('error', (error) => {
            Logger.error('MongoDB connection error', { error: error.message });
        });

        mongoose.connection.on('disconnected', () => {
            Logger.warn('MongoDB disconnected - attempting to reconnect...');
        });

        mongoose.connection.on('reconnected', () => {
            Logger.info('MongoDB reconnected');
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
export const getDb = () => {
    if (!mongoose.connection || !mongoose.connection.db) {
        throw new Error('Database not connected');
    }
    return mongoose.connection.db;
};
