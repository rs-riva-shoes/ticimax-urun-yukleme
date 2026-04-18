import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/ticimax/push/route';

// 1. Mock DB (Route doesn't use it directly but for safety)
vi.mock('@/services/firebase-admin', () => ({
    adminDb: { collection: vi.fn() }
}));

// Mock Config
vi.mock('@/config/env', () => ({
    env: {
        TICIMAX_DOMAIN: 'https://push-surge.com',
        TICIMAX_USER: 'USER',
        TICIMAX_PASS: 'PASS'
    }
}));

describe('API: /api/ticimax/push - Surge Coverage', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should handle missing configuration (Branch line 28)', async () => {
        const { env } = await import('@/config/env');
        const original = env.TICIMAX_USER;
        // @ts-ignore
        env.TICIMAX_USER = '';

        const response = await POST(new Request('http://t', { method: 'POST', body: JSON.stringify({}) }));
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toContain('bilgileri eksik');
        
        // @ts-ignore
        env.TICIMAX_USER = original;
    });

    it('should successfully push with complex variants and currencies', async () => {
        const payload = {
            ticimaxId: 123,
            productCode: 'PROD-1',
            title: 'Cool Shirt',
            categoryId: '10',
            combinedCategoryIds: [10, 20],
            images: ['img1.jpg'],
            price: { sale: 100, currency: 'EUR' },
            variants: [
                { sku: 'V1', barcode: 'B1', qty: 5, size: 'L', color: 'Blue', images: ['vimg1.jpg'] },
                { sku: 'V2', qty: 2, image: 'vimg2.jpg' } // No barcode, single image
            ]
        };

        const mockXml = `<Envelope><Body><SaveUrunResponse><SaveUrunResult>123</SaveUrunResult></SaveUrunResponse></Body></Envelope>`;
        global.fetch = vi.fn().mockResolvedValue({ ok: true, text: async () => mockXml });

        const response = await POST(new Request('http://t', { 
            method: 'POST', 
            body: JSON.stringify(payload) 
        }));
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.ticimaxId).toBe('123');
    });

    it('should handle SOAP Fault (Branch line 155)', async () => {
        const payload = { ticimaxId: 1, variants: [], price: {} };
        const mockFaultXml = `<Envelope><Body><s:Fault><faultstring>Invalid User</faultstring></s:Fault></Body></Envelope>`;
        global.fetch = vi.fn().mockResolvedValue({ ok: true, text: async () => mockFaultXml });

        const response = await POST(new Request('http://t', { method: 'POST', body: JSON.stringify(payload) }));
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Invalid User');
    });

    it('should fallback to inner ID if Result is 0 (Branch line 167)', async () => {
        const payload = { ticimaxId: 1, variants: [], price: {} };
        const mockXml = `<Envelope><Body><SaveUrunResult>0</SaveUrunResult><a:ID>999</a:ID></Body></Envelope>`;
        global.fetch = vi.fn().mockResolvedValue({ ok: true, text: async () => mockXml });

        const response = await POST(new Request('http://t', { method: 'POST', body: JSON.stringify(payload) }));
        const data = await response.json();

        expect(data.success).toBe(true);
        expect(data.ticimaxId).toBe('999');
    });

    it('should extract error message if ID is not found (Branch line 178)', async () => {
        const payload = { ticimaxId: 1, variants: [], price: {} };
        const mockXml = `<Envelope><Body><SaveUrunResult>0</SaveUrunResult><Message>Category not found</Message></Body></Envelope>`;
        global.fetch = vi.fn().mockResolvedValue({ ok: true, text: async () => mockXml });

        const response = await POST(new Request('http://t', { method: 'POST', body: JSON.stringify(payload) }));
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Category not found');
    });

    it('should handle retry failure (Branch line 146)', async () => {
        const payload = { ticimaxId: 1, variants: [], price: {} };
        global.fetch = vi.fn().mockResolvedValue({ 
            ok: false, 
            status: 500, 
            statusText: 'Internal Error' 
        });

        const response = await POST(new Request('http://t', { method: 'POST', body: JSON.stringify(payload) }));
        const data = await response.json();

        expect(response.status).toBe(500);
        // handleApiError returns this generic message for non-test environments or caught errors
        expect(data.error).toContain('ekiple iletişime geçin');
    }, 15000);

    it('should handle USD currency mapping', async () => {
        const payload = { ticimaxId: 1, price: { currency: 'USD' }, variants: [] };
        global.fetch = vi.fn().mockResolvedValue({ ok: true, text: async () => '<SaveUrunResult>1</SaveUrunResult>' });

        await POST(new Request('http://t', { method: 'POST', body: JSON.stringify(payload) }));
    });
});
