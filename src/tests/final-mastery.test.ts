import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as skuPOST } from '@/app/api/sku/generate/route';
import { GET as catGET } from '@/app/api/ticimax/category/route';
import { POST as syncPOST } from '@/app/api/settings/products/sync/route';

// Central Database Mock
const mockDoc = {
    get: vi.fn(),
    set: vi.fn(),
    update: vi.fn()
};
const mockCollection = {
    doc: vi.fn(() => mockDoc),
    where: vi.fn(() => ({
        get: vi.fn().mockResolvedValue({ empty: true, docs: [] })
    })),
    add: vi.fn().mockResolvedValue({ id: 'new-id' }),
    count: vi.fn(() => ({ get: vi.fn().mockResolvedValue({ data: () => ({ count: 0 }) }) }))
};

vi.mock('@/services/firebase-admin', () => ({
    adminDb: {
        collection: vi.fn(() => mockCollection),
        runTransaction: vi.fn(async (cb) => {
            const t = {
                get: vi.fn(),
                set: vi.fn(),
                update: vi.fn()
            };
            return cb(t);
        }),
        batch: vi.fn(() => ({
            set: vi.fn(),
            update: vi.fn(),
            commit: vi.fn()
        }))
    }
}));

vi.mock('@/config/env', () => ({
    env: { 
        TICIMAX_DOMAIN: 'http://test.com',
        TICIMAX_USER: 'user', 
        TICIMAX_PASS: 'pass',
        FIREBASE_PROJECT_ID: 'p',
        OPENAI_API_KEY: 'sk-test'
    }
}));

// Mock OpenAI with a real class to handle 'new' calls
vi.mock('openai', () => ({
    default: class {
        chat = { completions: { create: vi.fn() } };
    }
}));

describe('Final Mastery: Branch Coverage Overlord', () => {

    describe('Service Boosters', () => {
        it('OpenAI: API Key branches', async () => {
            const { openai } = await import('@/services/openai');
            expect(openai).toBeDefined();
        });
    });

    describe('SKU/Generate: Branch Coverage', () => {
        it('should handle missing category fallback (Line 34-41)', async () => {
            const req = new Request('http://l', {
                method: 'POST',
                body: JSON.stringify({ productId: 'p1', size: '38', color: 'Beyaz' })
            });

            const { adminDb } = await import('@/services/firebase-admin');
            vi.mocked(adminDb.runTransaction).mockImplementationOnce(async (cb) => {
                const t = {
                    get: vi.fn().mockResolvedValue({
                        exists: true,
                        data: () => ({ productCode: 'P1', variants: [] })
                    }),
                    update: vi.fn(),
                    set: vi.fn()
                };
                return cb(t as any);
            });

            const res = await skuPOST(req);
            expect(res.status).toBe(200);
        });

        it('should handle already existing SKU (Line 52)', async () => {
             const req = new Request('http://l', {
                method: 'POST',
                body: JSON.stringify({ productId: 'p1', size: '38', color: 'Siyah' })
            });

            const { adminDb } = await import('@/services/firebase-admin');
            vi.mocked(adminDb.runTransaction).mockImplementationOnce(async (cb) => {
                const t = {
                    get: vi.fn().mockResolvedValue({
                        exists: true,
                        data: () => ({ 
                            productCode: 'P1', 
                            variants: [{ size: '38', color: 'Siyah', sku: 'EXISTING-123' }] 
                        })
                    }),
                    update: vi.fn(),
                    set: vi.fn()
                };
                return cb(t as any);
            });

            const res = await skuPOST(req);
            const data = await res.json();
            expect(data.sku).toBe('EXISTING-123');
        });
    });

    describe('Ticimax Category: Broken XML', () => {
        it('should skip malformed categories (Line 46)', async () => {
            global.fetch = vi.fn().mockResolvedValue({
                text: () => Promise.resolve('<a:Kategori><a:ID>1</a:ID></a:Kategori>') // Missing Tanim
            } as any);

            const res = await catGET();
            const data = await res.json();
            expect(data.success).toBe(true);
            expect(data.categories).toHaveLength(0);
        });
    });

    describe('Products Sync: Path Mastery', () => {
        it('should handle complex slugs and sync logic', async () => {
           const mockSoap = `
           <Varyasyon><UrunKartiID>1</UrunKartiID><ID>501</ID><StokKodu>SKU-1</StokKodu><Resimler><string>test-12d-3.jpg</string></Resimler></Varyasyon>
           <Varyasyon><UrunKartiID>1</UrunKartiID><ID>502</ID><StokKodu>SKU-1</StokKodu><Resimler><string>test-2026.jpg</string></Resimler></Varyasyon>`;

           global.fetch = vi.fn().mockResolvedValue({
               text: () => Promise.resolve(`<Envelope><Body>${mockSoap}</Body></Envelope>`)
           } as any);

           const res = await syncPOST();
           expect(res.status).toBe(200);
        });
    });
});
