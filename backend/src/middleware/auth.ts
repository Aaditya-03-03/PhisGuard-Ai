import type { Request, Response, NextFunction } from 'express';

/**
 * API Key authentication middleware
 * Validates the X-API-Key header against the configured API key
 */
export function apiKeyAuth(req: Request, res: Response, next: NextFunction): void {
    const apiKey = req.header('X-API-Key');
    const expectedKey = process.env.API_KEY;

    if (!expectedKey) {
        console.error('API_KEY environment variable is not set');
        res.status(500).json({
            success: false,
            error: 'Server configuration error'
        });
        return;
    }

    if (!apiKey) {
        res.status(401).json({
            success: false,
            error: 'Missing API key. Include X-API-Key header.'
        });
        return;
    }

    if (apiKey !== expectedKey) {
        res.status(403).json({
            success: false,
            error: 'Invalid API key'
        });
        return;
    }

    next();
}

/**
 * Error handling middleware
 */
export function errorHandler(
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
): void {
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);

    res.status(500).json({
        success: false,
        error: process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : err.message
    });
}

/**
 * Request logging middleware
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
}
