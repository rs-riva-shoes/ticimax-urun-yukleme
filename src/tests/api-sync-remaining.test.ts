import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as syncCategories } from '@/app/api/settings/categories/sync/route';
import { POST as syncBrands } from '@/app/api/settings/brands/sync/route';
import { POST as syncSuppliers } from '@/app/api/settings/suppliers/sync/route';

// 1. Hoist DB Mocks
const mocks = vi.hoisted(() => ({
    set: vi.fn(),
    doc: vi.fn(),
    collection: vi.fn()
}));

// Mock exactly what the routes import
vi.mock('@/services/firebase-admin', () => ({
    adminDb: {
        collection: mocks.collection
    }
}));

// Mock Config
vi.mock('@/config/env', () => ({
    env: {
        TICIMAX_DOMAIN: 'https://sync-remain.com',
        TICIMAX_USER: 'ALL_USER',
        TICIMAX_PASS: 'ALL_PASS'
    }
}));

describe('API: Settings Sync Remaining Routes', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        mocks.doc.mockReturnValue({ set: mocks.set });
        mocks.collection.mockReturnValue({ doc: mocks.doc });
    });

    describe('Categories Sync', () => {
        it('should sync categories efficiently', async () => {
            const mockXml = `<Kategori><ID>1</ID><Tanim>Z</Tanim></Kategori><Kategori><ID>2</ID><Tanim>A</Tanim></Kategori>`;
            global.fetch = vi.fn().mockResolvedValue({ ok: true, text: async () => mockXml });

            await syncCategories();
            expect(mocks.set).toHaveBeenCalled();
            const savedData = mocks.set.mock.calls[0][0];
            expect(savedData.list[0].name).toBe('A');
        });

        it('should handle crash in categories', async () => {
            global.fetch = vi.fn().mockImplementation(() => { throw new Error("E"); });
            const response = await syncCategories();
            expect(response.status).toBe(500);
        });
    });

    describe('Brands Sync', () => {
        it('should sync brands successfully', async () => {
            const mockXml = `<Marka><ID>5</ID><Tanim>Nike</Tanim></Marka>`;
            global.fetch = vi.fn().mockResolvedValue({ ok: true, text: async () => mockXml });

            await syncBrands();
            expect(mocks.set).toHaveBeenCalled();
        });

        it('should handle brands network error', async () => {
            global.fetch = vi.fn().mockResolvedValue({ ok: false });
            const response = await syncBrands();
            expect(response.status).toBe(500);
        });
    });

    describe('Suppliers Sync', () => {
        it('should sync suppliers and add Default Supplier', async () => {
            const mockXml = `<Tedarikci><ID>50</ID><Tanim>Real</Tanim></Tedarikci>`;
            global.fetch = vi.fn().mockResolvedValue({ ok: true, text: async () => mockXml });

            const response = await syncSuppliers();
            const data = await response.json();

            expect(data.count).toBe(2);
            expect(mocks.set).toHaveBeenCalled();
        });

        it('should handle empty supplier list', async () => {
             global.fetch = vi.fn().mockResolvedValue({ ok: true, text: async () => '<Empty></Empty>' });
             const response = await syncSuppliers();
             const data = await response.json();
             expect(data.count).toBe(1);
        });
    });
});
