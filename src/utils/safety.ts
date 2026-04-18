/**
 * Production-Grade Safety Utilities
 */

// 1. Structured Logger
export const logger = {
    info: (message: string, context?: any) => {
        console.log(`[INFO] [${new Date().toISOString()}] ${message}`, context ? JSON.stringify(context, null, 2) : '');
    },
    error: (message: string, error?: any) => {
        console.error(`[ERROR] [${new Date().toISOString()}] ${message}`, {
            message: error?.message,
            stack: error?.stack,
            cause: error?.cause
        });
    },
    warn: (message: string, context?: any) => {
        console.warn(`[WARN] [${new Date().toISOString()}] ${message}`, context || '');
    }
};

// 2. Exponential Backoff Retry Logic
export async function withRetry<T>(
    fn: () => Promise<T>,
    options: { maxRetries?: number; delay?: number } = {}
): Promise<T> {
    const { maxRetries = 3, delay = 1000 } = options;
    let lastError: any;

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
export function handleApiError(error: any) {
    logger.error('API Route Error Handled', error);
    
    if (error.name === 'ValidationError') {
        return Response.json({ success: false, error: error.message }, { status: 400 });
    }

    return Response.json({ 
        success: false, 
        error: 'Sistem hatası oluştu. Lütfen teknik ekiple iletişime geçin.',
        debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
}
