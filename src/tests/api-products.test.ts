import { describe, it, expect, vi } from 'vitest';
import { GET } from '@/app/api/products/count/route';
import { adminDb } from '@/services/firebase-admin';

// adminDb'yi tamamen mocklamak yerine içindeki metodları spy ediyoruz
vi.mock('@/services/firebase-admin', () => ({
    adminDb: {
        collection: vi.fn(() => ({
            count: vi.fn(() => ({
                get: vi.fn().mockResolvedValue({
                    data: () => ({ count: 42 })
                })
            }))
        }))
    }
}));

describe('API: /api/products/count', () => {
    it('should return correct product count from database', async () => {
        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.count).toBe(42);
    });
});
