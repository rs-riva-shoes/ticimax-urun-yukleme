import { describe, it, expect, vi } from 'vitest';
import { GET as getSuppliers } from '@/app/api/settings/suppliers/route';
import { POST as syncSuppliers } from '@/app/api/settings/suppliers/sync/route';
import { GET as getTicimaxCategory } from '@/app/api/ticimax/category/route';

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

vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    text: () => Promise.resolve('<Envelope><Body><Tedarikci><ID>1</ID><Tanim>Test</Tanim></Tedarikci><Kategori><ID>100</ID><Tanim>Test</Tanim></Kategori></Body></Envelope>')
}));

describe('API: Final Integration Routes', () => {
    
    describe('Suppliers API', () => {
        it('should list suppliers', async () => {
            const resp = await getSuppliers();
            expect(resp.status).toBe(200);
        });

        it('should sync suppliers from Ticimax', async () => {
             const resp = await syncSuppliers();
             expect(resp.status).toBe(200);
        });
    });

    describe('Ticimax Category API', () => {
        it('should fetch category tree', async () => {
            const resp = await getTicimaxCategory();
            const data = await resp.json();
            expect(resp.status).toBe(200);
            expect(data.success).toBe(true);
        });
    });
});
