import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/settings/products/sync/route';

// 1. Hoist ALL Mocks
const mocks = vi.hoisted(() => ({
    batch: vi.fn(),
    collection: vi.fn(),
    commit: vi.fn(),
    update: vi.fn(),
    set: vi.fn(),
    doc: vi.fn(),
    where: vi.fn(),
    get: vi.fn()
}));

// 2. Mock exactly what the route imports
vi.mock('@/services/firebase-admin', () => ({
    adminDb: {
        batch: mocks.batch,
        collection: mocks.collection
    }
}));

// Mock Config
vi.mock('@/config/env', () => ({
    env: {
        TICIMAX_DOMAIN: 'https://sync-surge.com',
        TICIMAX_USER: 'USER',
        TICIMAX_PASS: 'PASS'
    }
}));

describe('API: /api/settings/products/sync - Logic Surge', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        
        const mockBatch = {
            update: mocks.update,
            set: mocks.set,
            commit: mocks.commit.mockResolvedValue(true)
        };
        mocks.batch.mockReturnValue(mockBatch);
        
        mocks.get.mockResolvedValue({ empty: true, docs: [] });
        mocks.where.mockReturnValue({ get: mocks.get });
        mocks.collection.mockReturnValue({
            where: mocks.where,
            doc: mocks.doc.mockReturnValue({ set: mocks.set })
        });
    });

    it('should handle missing configuration', async () => {
        const { env } = await import('@/config/env');
        const originalUser = env.TICIMAX_USER;
        // @ts-ignore
        env.TICIMAX_USER = '';

        const response = await POST();
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('API Ayarları eksik');

        // @ts-ignore
        env.TICIMAX_USER = originalUser;
    });

    it('should successfully sync products with complex logic and fallbacks', async () => {
        // Mock Responses to trigger regex and fallbacks (Line 158, 164, etc)
        const mockBrandsXml = `<S><Marka><ID>1</ID><Tanim>BrandA</Tanim></Marka></S>`;
        const mockCatsXml = `<S><Kategori><ID>10</ID><Tanim>CatA</Tanim></Kategori></S>`;
        const mockProductsXml = `
            <UrunKarti>
                <ID>100</ID>
                <AnaKategoriID>99</AnaKategoriID> <!-- Not in catMap -->
                <AnaKategori>FallbackCat</AnaKategori> <!-- Trigger 158 -->
                <MarkaID>2</MarkaID> <!-- Not in brandMap -->
                <Marka>FallbackBrand</Marka> <!-- Trigger 164 -->
            </UrunKarti>
        `;
        const mockVaryasyonXml = `
            <Varyasyon>
                <ID>999</ID>
                <UrunKartiID>100</UrunKartiID>
                <Aktif>true</Aktif>
                <SatisFiyati>150</SatisFiyati>
                <Kategoriler><int>10</int></Kategoriler> <!-- Trigger 240/243 -->
            </Varyasyon>
            <Varyasyon>
                <ID>998</ID>
                <UrunKartiID>100</UrunKartiID>
                <SatisFiyati>120</SatisFiyati> <!-- Update Price logic 272 -->
                <Aktif>true</Aktif>
            </Varyasyon>
        `;

        let callCount = 0;
        global.fetch = vi.fn().mockImplementation(async () => {
            callCount++;
            if (callCount === 1) return { ok: true, text: async () => mockBrandsXml };
            if (callCount === 2) return { ok: true, text: async () => mockCatsXml };
            if (callCount === 3) return { ok: true, text: async () => mockProductsXml };
            return { ok: true, text: async () => mockVaryasyonXml };
        });

        const response = await POST();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(mocks.batch).toHaveBeenCalled();
    });

    it('should handle Firestore batch limit (450+ items)', async () => {
         let variations = '';
         for(let i=1; i<=455; i++) {
            variations += `<Varyasyon><ID>${i}</ID><UrunKartiID>${i}</UrunKartiID><Aktif>true</Aktif></Varyasyon>`;
         }
         const mockVaryasyonXml = `<S>${variations}</S>`;

         let callCount = 0;
         global.fetch = vi.fn().mockImplementation(async () => {
             callCount++;
             if (callCount === 4) return { ok: true, text: async () => mockVaryasyonXml };
             return { ok: true, text: async () => `<S></S>` };
         });

         const response = await POST();
         const data = await response.json();

         expect(data.count).toBe(455);
         expect(mocks.commit).toHaveBeenCalledTimes(2);
    });

    it('should handle zero products failure (400)', async () => {
        global.fetch = vi.fn().mockResolvedValue({ ok: true, text: async () => '<Empty></Empty>' });
        const response = await POST();
        expect(response.status).toBe(400);
    });

    it('should handle network exceptions in POST', async () => {
        global.fetch = vi.fn().mockImplementation(() => { throw new Error("Network Down"); });
        const response = await POST();
        expect(response.status).toBe(500);
    });

    it('should update existing records in Firestore', async () => {
        mocks.get.mockResolvedValue({ 
            empty: false, 
            docs: [{ ref: 'DOC_REF' }] 
        });

        const mockVarXml = `<Varyasyon><ID>1</ID><UrunKartiID>100</UrunKartiID><Aktif>true</Aktif></Varyasyon>`;

        let callCount = 0;
        global.fetch = vi.fn().mockImplementation(async () => {
            callCount++;
            if (callCount === 4) return { ok: true, text: async () => mockVarXml };
            return { ok: true, text: async () => `<S></S>` };
        });

        const response = await POST();
        expect(response.status).toBe(200);
        expect(mocks.update).toHaveBeenCalled();
    });
});
