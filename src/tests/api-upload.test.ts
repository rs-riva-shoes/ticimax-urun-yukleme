import { describe, it, expect, vi } from 'vitest';
import { POST } from '@/app/api/upload/route';
import { adminStorage } from '@/services/firebase-admin';

vi.mock('@/services/firebase-admin', () => ({
    adminStorage: {
        bucket: vi.fn(() => ({
            file: vi.fn(() => ({
                save: vi.fn().mockResolvedValue(true)
            }))
        }))
    }
}));

// Mock env
vi.mock('@/config/env', () => ({
    env: {
        FIREBASE_STORAGE_BUCKET: 'test-bucket',
        FIREBASE_PROJECT_ID: 'test-project'
    }
}));

describe('API: /api/upload', () => {
    it('should upload a base64 image successfully', async () => {
        const mockBase64 = 'data:image/jpeg;base64,mockdata';
        const req = new Request('http://localhost:3000/api/upload', {
            method: 'POST',
            body: JSON.stringify({ image: mockBase64 })
        });

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.url).toContain('https://storage.googleapis.com/test-bucket/');
    });

    it('should return 400 for invalid image format', async () => {
        const req = new Request('http://localhost:3000/api/upload', {
            method: 'POST',
            body: JSON.stringify({ image: 'not-base64' })
        });

        const response = await POST(req);
        expect(response.status).toBe(400);
    });
});
