import { describe, it, expect, vi } from 'vitest';
import { POST as syncPOST } from '@/app/api/settings/products/sync/route';
import { POST as savePOST } from '@/app/api/products/save/route';

// Ortam değişkenlerini mockla
vi.mock('@/config/env', () => ({
    env: { 
        TICIMAX_DOMAIN: 'https://test.site.com',
        TICIMAX_USER: 'test-user',
        TICIMAX_PASS: 'test-pass'
    }
}));


// Profesyonel Seviye Firestore Mock Yapısı
const mockBatch = {
    set: vi.fn(),
    update: vi.fn(),
    commit: vi.fn().mockResolvedValue(true)
};

vi.mock('@/services/firebase-admin', () => ({
    adminDb: {
        collection: vi.fn(() => ({
            get: vi.fn().mockResolvedValue({ docs: [], empty: true }),
            doc: vi.fn(() => ({
                set: vi.fn().mockResolvedValue(true),
                update: vi.fn().mockResolvedValue(true),
                get: vi.fn().mockResolvedValue({ exists: false }),
                ref: {}
            })),
            where: vi.fn(() => ({
                get: vi.fn().mockResolvedValue({ docs: [], empty: true })
            })),
            add: vi.fn().mockResolvedValue({ id: 'new-id' })
        })),
        batch: vi.fn(() => mockBatch),
        runTransaction: vi.fn(cb => cb({
            get: vi.fn().mockResolvedValue({ exists: false }),
            set: vi.fn(),
            update: vi.fn()
        }))
    }
}));

// Fetch/SOAP Mock (Ticimax Yanıtları)
vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    text: () => Promise.resolve(`
        <SelectUrunResult><UrunKarti><ID>1</ID><AnaKategoriID>100</AnaKategoriID></UrunKarti></SelectUrunResult>
        <SelectVaryasyonResult><Varyasyon><ID>10</ID><UrunKartiID>1</UrunKartiID><StokKodu>TEST-SKU</StokKodu></Varyasyon></SelectVaryasyonResult>
        <SelectMarkaResult><Marka><ID>16</ID><Tanim>Arslan</Tanim></Marka></SelectMarkaResult>
        <SelectKategoriResult><Kategori><ID>100</ID><Tanim>Ayakkabı</Tanim></Kategori></SelectKategoriResult>
    `)
}));

describe('API: Product Sync & Save (Enterprise Logic Tests)', () => {
    it('Sync route should process SOAP and batch store to Firebase', async () => {
        const response = await syncPOST();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.count).toBeGreaterThan(0);
    });

    it('Save route should store product via add()', async () => {
        const req = new Request('http://localhost/api/products/save', {
            method: 'POST',
            body: JSON.stringify({ productId: '1', title: 'Test Product' })
        });
        const response = await savePOST(req);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
    });
});
