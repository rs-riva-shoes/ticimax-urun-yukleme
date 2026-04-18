import { describe, it, expect, vi } from 'vitest';
import { GET as getBrands } from '@/app/api/settings/brands/route';
import { POST as syncBrands } from '@/app/api/settings/brands/sync/route';
import { GET as getCats } from '@/app/api/settings/categories/route';
import { POST as syncCats } from '@/app/api/settings/categories/sync/route';
import { POST as syncAttrs } from '@/app/api/settings/attributes/sync/route';

// Global Mocks
vi.mock('@/services/firebase-admin', () => ({
    adminDb: {
        collection: vi.fn(() => ({
            doc: vi.fn(() => ({
                set: vi.fn().mockResolvedValue(true),
                get: vi.fn().mockResolvedValue({ exists: true, data: () => ({ list: [] }) })
            })),
            get: vi.fn().mockResolvedValue({ docs: [] })
        }))
    }
}));

vi.mock('@/config/env', () => ({
    env: { 
        TICIMAX_DOMAIN: 'https://test.site.com', 
        TICIMAX_USER: 'test-user', 
        TICIMAX_PASS: 'test-pass' 
    }
}));

// Gerçekçi XML Yanıtları
vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    text: () => Promise.resolve(`
        <Envelope>
            <Body>
                <Marka><ID>1</ID><Tanim>Arslan</Tanim></Marka>
                <Kategori><ID>100</ID><Tanim>Ayakkabı</Tanim></Kategori>
                <Tedarikci><ID>1</ID><Tanim>Ana Tedarikçi</Tanim></Tedarikci>
                <UrunOzellik><ID>1</ID><Tanim>Renk</Tanim></UrunOzellik>
            </Body>
        </Envelope>
    `)
}));

describe('API: Settings & Attributes (Broad Coverage)', () => {
    
    describe('Brands', () => {
        it('should get brand list', async () => {
            const resp = await getBrands();
            expect(resp.status).toBe(200);
        });
        it('should sync brands', async () => {
            const resp = await syncBrands();
            expect(resp.status).toBe(200);
        });
    });

    describe('Categories', () => {
        it('should get category list', async () => {
            const resp = await getCats();
            expect(resp.status).toBe(200);
        });
        it('should sync categories', async () => {
             const resp = await syncCats();
             expect(resp.status).toBe(200);
        });
    });

    describe('Attributes', () => {
        it('should sync attributes', async () => {
            const resp = await syncAttrs();
            expect(resp.status).toBe(200);
        });
    });
});
