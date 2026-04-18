import { describe, it, expect, vi } from 'vitest';
import { POST } from '@/app/api/sku/generate/route';
import { adminDb } from '@/services/firebase-admin';

// More detailed mock for transaction
vi.mock('@/services/firebase-admin', () => ({
    adminDb: {
        collection: vi.fn(() => ({
            doc: vi.fn(() => ({
                id: 'mock-id'
            }))
        })),
        runTransaction: vi.fn((cb) => cb({
            get: vi.fn((ref) => {
                // If it's a product ref
                if (ref.id === 'mock-id') {
                    return Promise.resolve({
                        exists: true,
                        data: () => ({ 
                            categoryId: '102', 
                            categoryName: 'Kadın Ayakkabı',
                            variants: [] 
                        })
                    });
                }
                // Counter ref
                return Promise.resolve({ exists: true, data: () => ({ lastSeq: 5 }) });
            }),
            update: vi.fn(),
            set: vi.fn()
        }))
    }
}));

describe('API: /api/sku/generate', () => {

    it('should generate a new SKU successfully', async () => {
        const req = new Request('http://localhost:3000/api/sku/generate', {
            method: 'POST',
            body: JSON.stringify({
                productId: 'mock-id',
                size: '38',
                color: 'Siyah',
                categoryId: '102',
                categoryName: 'Kadın Ayakkabı'
            })
        });

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.sku).toContain('RV-K-'); // Based on Kadın Ayakkabı
        expect(data.sku).toContain('-38-');
    });

    it('should return 400 if required fields are missing', async () => {
        const req = new Request('http://localhost:3000/api/sku/generate', {
            method: 'POST',
            body: JSON.stringify({ productId: '123' })
        });

        const response = await POST(req);
        expect(response.status).toBe(400);
    });
});
