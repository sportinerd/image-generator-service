import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDatabase, disconnectDatabase } from './config/database';
import { imageGenerator } from './services/imageGenerator';
import { Logger } from './utils/logger';
import imageRoutes from './routes/image.routes';
import testRoutes from './routes/test.routes';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
    Logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('user-agent'),
    });
    next();
});

// Health check route
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
    });
});

// API routes
app.use('/api/images', imageRoutes);
app.use('/api/test', testRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`,
    });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    Logger.error('Unhandled error', { error: err.message, stack: err.stack });
    res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    });
});

// Initialize server
const startServer = async () => {
    try {
        // Connect to MongoDB
        await connectDatabase();

        // Initialize browser pool
        await imageGenerator.initialize();

        // Start server
        app.listen(PORT, () => {
            Logger.info(`Server is running on port ${PORT}`, {
                environment: process.env.NODE_ENV || 'development',
                port: PORT,
            });
        });
    } catch (error) {
        Logger.error('Failed to start server', { error });
        process.exit(1);
    }
};

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
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

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start the server
startServer();
