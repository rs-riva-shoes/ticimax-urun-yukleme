/**
 * Production-Grade Safety Utilities
 */

import { Response } from "next/dist/compiled/@edge-runtime/primitives";

// 1. Structured Logger
export const logger = {
    info: (message: string, context?: unknown) => {
        console.log(`[INFO] [${new Date().toISOString()}] ${message}`, context ? JSON.stringify(context, null, 2) : '');
    },
    error: (message: string, error?: unknown) => {
        const err = error as Error;
        console.error(`[ERROR] [${new Date().toISOString()}] ${message}`, {
            message: err?.message,
            stack: err?.stack,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            cause: (err as any)?.cause
        });
    },
    warn: (message: string, context?: unknown) => {
        console.warn(`[WARN] [${new Date().toISOString()}] ${message}`, context || '');
    }
};

// 2. Exponential Backoff Retry Logic
export async function withRetry<T>(
    fn: () => Promise<T>,
    options: { maxRetries?: number; delay?: number } = {}
): Promise<T> {
    const { maxRetries = 3, delay = 1000 } = options;
    let lastError: unknown;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            const waitTime = delay * Math.pow(2, attempt); // 1s, 2s, 4s...
            logger.warn(`Attempt ${attempt + 1} failed. Retrying in ${waitTime}ms...`, { error: (error as Error).message });
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
    }

    logger.error(`All ${maxRetries} attempts failed.`, lastError);
    throw lastError;
}

// 3. Normalized Error Handler for API Routes
export function handleApiError(error: unknown) {
    logger.error('API Route Error Handled', error);
    
    const err = error as { name?: string; message?: string };
    
    if (err.name === 'ValidationError' || err.name === 'ZodError') {
        return Response.json({ success: false, error: err.message }, { status: 400 });
    }

    return Response.json({ 
        success: false, 
        error: 'Sistem hatası oluştu. Lütfen teknik ekiple iletişime geçin.',
        debug: process.env.NODE_ENV === 'development' ? err.message : undefined
    }, { status: 500 });
}
