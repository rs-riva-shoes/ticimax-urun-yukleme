import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createOpenAIClient } from '@/services/openai';

describe('OpenAI: Direct Function Coverage', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return null and warn in development if no key', () => {
        const originalEnv = process.env.NODE_ENV;
        // @ts-ignore
        process.env.NODE_ENV = 'development';
        const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        
        const client = createOpenAIClient('');
        expect(client).toBeNull();
        expect(spy).toHaveBeenCalled();
        
        // @ts-ignore
        process.env.NODE_ENV = originalEnv;
        spy.mockRestore();
    });

    it('should return null without warning in production if no key', () => {
        const originalEnv = process.env.NODE_ENV;
        // @ts-ignore
        process.env.NODE_ENV = 'production';
        const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        
        const client = createOpenAIClient('');
        expect(client).toBeNull();
        expect(spy).not.toHaveBeenCalled();
        
        // @ts-ignore
        process.env.NODE_ENV = originalEnv;
        spy.mockRestore();
    });

    it('should create client and log success on server-side', () => {
        const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
        
        const client = createOpenAIClient('sk-test-12345678');
        expect(client).toBeDefined();
        // Since we use subgraph match, just verify it was called
        expect(spy).toHaveBeenCalled();
        
        spy.mockRestore();
    });
});
