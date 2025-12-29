import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { Logger } from './logger';
import imageRoutes from '../routes/image.routes';
import { imageGenerator } from '../services/imageGenerator';
import { disconnectDatabase } from '../config/database';

/**
 * Initialize all Global Middleware
 */
export const initializeMiddleware = (application: Application) => {
    application.use(cors());
    application.use(express.json({ limit: '10mb' }));
    application.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging middleware
    application.use((req: Request, res: Response, next: NextFunction) => {
        Logger.info(`${req.method} ${req.path}`, {
            ip: req.ip,
            userAgent: req.get('user-agent'),
        });
        next();
    });
};

/**
 * Initialize Application Routes
 */
export const initializeRoutes = (application: Application) => {
    // Health check route
    application.get('/health', (req: Request, res: Response) => {
        res.status(200).json({
            success: true,
            message: 'Server is running',
            timestamp: new Date().toISOString(),
        });
    });

    // API routes
    application.use('/api/images', imageRoutes);
};

/**
 * Initialize Error Handling
 */
export const initializeErrorHandling = (application: Application) => {
    // 404 handler
    application.use((req: Request, res: Response) => {
        res.status(404).json({
            success: false,
            error: 'Not Found',
            message: `Route ${req.method} ${req.path} not found`,
        });
    });

    // Global error handler
    application.use((err: Error, req: Request, res: Response, next: NextFunction) => {
        Logger.error('Unhandled error', { error: err.message, stack: err.stack });
        res.status(500).json({
            success: false,
            error: 'Internal Server Error',
            message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
        });
    });
};

/**
 * Graceful shutdown handler
 */
export const gracefulShutdown = async (signal: string) => {
    Logger.info(`${signal} received, shutting down gracefully`);

    try {
        // Cleanup browser pool
        await imageGenerator.cleanup();

        // Disconnect from MongoDB
        await disconnectDatabase();

        Logger.info('Shutdown complete');
        process.exit(0);
    } catch (error) {
        Logger.error('Error during shutdown', { error });
        process.exit(1);
    }
};

/**
 * Setup Process Signal Listeners
 */
export const setupProcessHandling = () => {
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
};
