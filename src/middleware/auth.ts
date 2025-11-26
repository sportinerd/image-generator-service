import { Request, Response, NextFunction } from 'express';

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    const authKey = req.headers['auth_key'] as string || req.query.auth_key as string;
    const expectedAuthKey = process.env.AUTH_KEY;

    if (!expectedAuthKey) {
        res.status(500).json({
            success: false,
            error: 'Server configuration error',
            message: 'AUTH_KEY not configured on server',
        });
        return;
    }

    if (!authKey) {
        res.status(401).json({
            success: false,
            error: 'Unauthorized',
            message: 'auth_key is required in headers or query parameters',
        });
        return;
    }

    if (authKey !== expectedAuthKey) {
        res.status(401).json({
            success: false,
            error: 'Unauthorized',
            message: 'Invalid auth_key',
        });
        return;
    }

    next();
};
