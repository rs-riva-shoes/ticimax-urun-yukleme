import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/ticimax/push/route';

// Mock env
vi.mock('@/config/env', () => ({
    env: { 
        TICIMAX_DOMAIN: 'https://test.site.com',
        TICIMAX_USER: 'test-user',
        TICIMAX_PASS: 'test-pass'
    }
}));

// Mock Firebase
vi.mock('@/services/firebase-admin', () => ({
    adminDb: {
        collection: vi.fn(() => ({
            doc: vi.fn(() => ({
                update: vi.fn().mockResolvedValue(true)
            }))
        }))
    }
}));

// Global fetch mock
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('API: /api/ticimax/push (Final Pro Fix)', () => {
    
    beforeEach(() => {
        mockFetch.mockReset();
    });

    it('should push product to Ticimax successfully using fetch', async () => {
        // Mock successful SOAP response
        mockFetch.mockResolvedValue({
            text: () => Promise.resolve('<SaveUrunResult>123456</SaveUrunResult>')
        });

        const payload = {
            productId: 'test-prod',
            title: 'Profesyonel Bot',
            productCode: 'BOT-2026',
            brandId: '16',
            categoryId: '101',
            price: { sale: 2500, tax: 20, currency: 'TL' },
            variants: [{ size: '42', color: 'Siyah', qty: 5, sku: 'SKU-01', barcode: 'BAR-01' }],
            description: 'Test açıklama'
        };

        const req = new Request('http://localhost:3000/api/ticimax/push', {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.ticimaxId).toBe('123456');
    });

    it('should handle Ticimax errors (SaveUrunResult = 0)', async () => {
        mockFetch.mockResolvedValue({
            text: () => Promise.resolve('<SaveUrunResult>0</SaveUrunResult><Error>Zaten Kayıtlı</Error>')
        });

        const req = new Request('http://localhost:3000/api/ticimax/push', {
            method: 'POST',
            body: JSON.stringify({ 
                title: 'Hata Testi', 
                price: { sale: 10 },
                variants: [] 
            })
        });

        const response = await POST(req);
        expect(response.status).toBe(400);
    });
});
