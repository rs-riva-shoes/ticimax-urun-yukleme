import { describe, it, expect, vi } from 'vitest';

vi.mock('@/config/env', () => ({
    env: {
        TICIMAX_DOMAIN: 'https://test.com',
        TICIMAX_USER: 'test-user',
        TICIMAX_PASS: 'test-pass',
        FIREBASE_PROJECT_ID: 'test-project',
        OPENAI_API_KEY: 'test-key'
    },
    validateEnv: vi.fn()
}));

describe('API Deep Scan: POST & GET Methods', () => {
    
    it('Brands API: GET should list correctly', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            text: () => Promise.resolve('<Marka><ID>10</ID><Tanim>Arslan</Tanim></Marka>')
        });
        const { GET } = await import('@/app/api/settings/brands/route');
        const res = await GET(new Request('http://l/api/settings/brands'));
        const data = await res.json();
        expect(data.brands[0].name).toBe('Arslan');
    });

    it('Brands API: POST should save correctly', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            text: () => Promise.resolve('<SaveMarkaResult>1001</SaveMarkaResult>')
        });
        const { POST } = await import('@/app/api/settings/brands/route');
        const res = await POST(new Request('http://l/api/settings/brands', {
            method: 'POST',
            body: JSON.stringify({ name: 'New Brand' })
        }));
        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.brand.ticimaxId).toBe(1001);
    });

    it('Brands API: POST should handle missing name', async () => {
        const { POST } = await import('@/app/api/settings/brands/route');
        const res = await POST(new Request('http://l/api/settings/brands', {
            method: 'POST',
            body: JSON.stringify({})
        }));
        expect(res.status).toBe(400);
    });

    it('Suppliers API: POST should handle already existing result', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            text: () => Promise.resolve('<SaveTedarikciResult>0</SaveTedarikciResult><ID>555</ID>')
        });
        const { POST } = await import('@/app/api/settings/suppliers/route');
        const res = await POST(new Request('http://l/api/settings/suppliers', {
            method: 'POST',
            body: JSON.stringify({ name: 'Existing' })
        }));
        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.supplier.ticimaxId).toBe(555);
    });
});
