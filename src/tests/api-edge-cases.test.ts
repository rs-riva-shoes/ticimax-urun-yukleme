import { describe, it, expect, vi } from 'vitest';
import { POST as savePOST } from '@/app/api/products/save/route';
import { POST as addVariantPOST } from '@/app/api/products/add-variant/route';

vi.mock('@/services/firebase-admin', () => ({
    adminDb: {
        collection: vi.fn(() => ({
            doc: vi.fn((id) => ({
                get: vi.fn().mockResolvedValue({
                    exists: id !== 'non-existent',
                    data: () => ({
                        productCode: 'SKU-001',
                        variants: [],
                        price: id === 'legacy-price' ? 100 : { sale: 100 },
                        categoryId: id === 'no-cat' ? '0' : '101'
                    })
                }),
                set: vi.fn().mockResolvedValue({}),
                update: vi.fn().mockResolvedValue({})
            })),
            add: vi.fn().mockResolvedValue({ id: 'new-id' })
        }))
    }
}));

describe('API Edge Cases: Save & Add Variant', () => {

    describe('Save Product Route', () => {
        it('should update existing product (Branch: if productId)', async () => {
            const req = new Request('http://l', { method: 'POST', body: JSON.stringify({ id: '123', title: 'Update' }) });
            const res = await savePOST(req);
            expect(await res.json()).toMatchObject({ success: true, message: 'Product updated successfully' });
        });

        it('should handle errors (Branch: catch)', async () => {
            const req = new Request('http://l', { method: 'POST', body: 'invalid-json' });
            const res = await savePOST(req);
            expect(res.status).toBe(500);
        });
    });

    describe('Add Variant Route', () => {
        it('should handle missing category (Branch: !hasCategory)', async () => {
            const req = new Request('http://l', {
                method: 'POST',
                body: JSON.stringify({ productId: 'no-cat', variants: [{ size: 'M' }] })
            });
            const res = await addVariantPOST(req);
            const data = await res.json();
            expect(data.ticimax.error).toContain('Kategorisi Seçilmemiş');
        });

        it('should handle legacy price number (Branch: legacy conversion)', async () => {
            const req = new Request('http://l', {
                method: 'POST',
                body: JSON.stringify({ productId: 'legacy-price', variants: [{ size: 'L' }] })
            });
            // We mock fetch for the Ticimax push inside add-variant
            global.fetch = vi.fn().mockResolvedValue({ json: () => Promise.resolve({ success: true, ticimaxId: 1 }) });
            
            const res = await addVariantPOST(req);
            expect(res.status).toBe(200);
        });

        it('should handle JSON parse errors from Ticimax (Branch: catch parse error)', async () => {
            const req = new Request('http://l', {
                method: 'POST',
                body: JSON.stringify({ productId: '123', variants: [{ size: 'S' }] })
            });
            
            // Return invalid JSON from the internal fetch
            global.fetch = vi.fn().mockResolvedValue({
                json: () => Promise.reject(new Error('JSON Parse Error')),
                text: () => Promise.resolve('Raw Error String')
            });
            
            const res = await addVariantPOST(req);
            const data = await res.json();
            expect(data.ticimax.success).toBe(false);
        });

        it('should handle duplicate images (Branch: duplicate image skip)', async () => {
            const req = new Request('http://l', {
                method: 'POST',
                body: JSON.stringify({ 
                    productId: '123', 
                    variants: [], 
                    galleryImages: ['img1.jpg', 'img1.jpg'] // Duplicate
                })
            });
            const res = await addVariantPOST(req);
            expect(res.status).toBe(200);
        });
    });
});
