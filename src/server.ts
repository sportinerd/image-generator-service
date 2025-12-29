import express, { Application } from 'express';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database';
import { imageGenerator } from './services/imageGenerator';
import { Logger } from './utils/logger';
import {
    initializeMiddleware,
    initializeRoutes,
    initializeErrorHandling,
    setupProcessHandling
} from './utils/serverHelper';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

// 1. Setup App
initializeMiddleware(app);
initializeRoutes(app);
initializeErrorHandling(app);
setupProcessHandling();

// 2. Start Server
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

startServer();

