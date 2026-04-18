import { describe, it, expect, vi } from 'vitest';
import { POST as addVariant } from '@/app/api/products/add-variant/route';
import { POST as wipeProducts } from '@/app/api/settings/products/wipe/route';

// Profesyonel Batch Mock
const mockBatch = {
    delete: vi.fn(),
    commit: vi.fn().mockResolvedValue(true)
};

vi.mock('@/services/firebase-admin', () => ({
    adminDb: {
        collection: vi.fn(() => ({
            doc: vi.fn(() => ({
                update: vi.fn().mockResolvedValue(true),
                delete: vi.fn().mockResolvedValue(true),
                get: vi.fn().mockResolvedValue({ 
                    exists: true, 
                    data: () => ({ 
                        variants: [],
                        productCode: 'PARENT-SKU',
                        categoryId: '1'
                    }) 
                })
            })),
            get: vi.fn().mockResolvedValue({ 
                docs: [{ ref: { delete: vi.fn() } }],
                empty: false 
            }),
            where: vi.fn(() => ({
                get: vi.fn().mockResolvedValue({ empty: true })
            }))
        })),
        batch: vi.fn(() => mockBatch),
        runTransaction: vi.fn(cb => cb({
            get: vi.fn().mockResolvedValue({ 
                exists: true, 
                data: () => ({ 
                    variants: [],
                    productId: '1'
                }) 
            }),
            update: vi.fn()
        }))
    }
}));

// Add Variant içindeki fetch çağrısı (Ticimax push)
vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    json: () => Promise.resolve({ success: true, ticimaxId: '999' })
}));

describe('API: Product Operations (Final Fix)', () => {
    it('Add Variant should run logic with correct variants array', async () => {
        const req = new Request('http://localhost/api/products/add-variant', {
            method: 'POST',
            body: JSON.stringify({ 
                productId: 'test-id',
                variants: [  // Beklenen Dizi Formatı
                    { 
                        size: 'M', 
                        color: 'Kırmızı', 
                        qty: 10,
                        barcode: '8680000000001' 
                    }
                ]
            })
        });
        const resp = await addVariant(req);
        const data = await resp.json();
        expect(resp.status).toBe(200);
        expect(data.success).toBe(true);
    });

    it('Wipe Products should run logic with batching', async () => {
        const resp = await wipeProducts();
        expect(resp.status).toBe(200);
    });
});
