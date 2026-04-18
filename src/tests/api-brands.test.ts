import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/settings/brands/route';

// Mock Config
vi.mock('@/config/env', () => ({
    env: {
        TICIMAX_DOMAIN: 'https://test-brands.com',
        TICIMAX_USER: 'TEST_BRAND_USER'
    }
}));

describe('API: /api/settings/brands', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('GET - List Brands', () => {
        it('should fetch and parse brands successfully', async () => {
            const mockXml = `
                <Envelope>
                    <Body>
                        <SelectMarkaResponse>
                            <SelectMarkaResult>
                                <Marka>
                                    <ID>100</ID>
                                    <Tanim>Nike</Tanim>
                                </Marka>
                                <Marka>
                                    <ID>200</ID>
                                    <Tanim>Adidas</Tanim>
                                </Marka>
                            </SelectMarkaResult>
                        </SelectMarkaResponse>
                    </Body>
                </Envelope>
            `;

            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                text: async () => mockXml
            });

            const response = await GET();
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.brands).toHaveLength(2);
            expect(data.brands[0].name).toBe('Nike');
        });

        it('should handle configuration errors (missing user)', async () => {
            const { env } = await import('@/config/env');
            const originalUser = env.TICIMAX_USER;
            // @ts-ignore
            env.TICIMAX_USER = '';

            const response = await GET();
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data.error).toBe('API Ayarları eksik');

            // @ts-ignore
            env.TICIMAX_USER = originalUser;
        });

        it('should handle Ticimax connection errors', async () => {
            global.fetch = vi.fn().mockResolvedValue({
                ok: false,
                text: async () => 'SOAP Error'
            });

            const response = await GET();
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data.error).toBe('Ticimax bağlantı hatası');
        });

        it('should handle runtime exceptions (catch block)', async () => {
            global.fetch = vi.fn().mockImplementation(() => {
                throw new Error("Crash");
            });

            const response = await GET();
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data.error).toBe('Markalar alınamadı');
        });
    });

    describe('POST - Create Brand', () => {
        it('should create brand and escape characters', async () => {
            const request = new Request('http://test/api', {
                method: 'POST',
                body: JSON.stringify({ name: 'Jack & Jones "Special" <Edition>' })
            });

            const mockXml = `
                <Envelope>
                    <Body>
                        <SaveMarkaResponse>
                            <SaveMarkaResult>5001</SaveMarkaResult>
                        </SaveMarkaResponse>
                    </Body>
                </Envelope>
            `;

            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                text: async () => mockXml
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.brand.ticimaxId).toBe(5001);
        });

        it('should handle missing name validation', async () => {
            const request = new Request('http://test/api', {
                method: 'POST',
                body: JSON.stringify({ name: '' })
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error).toBe('Marka adı zorunlu');
        });

        it('should fallback to inner ID if SaveMarkaResult is 0', async () => {
            const request = new Request('http://test/api', {
                method: 'POST',
                body: JSON.stringify({ name: 'Inner ID Test' })
            });

            const mockXml = `
                <Envelope>
                    <Body>
                        <SaveMarkaResult>0</SaveMarkaResult>
                        <Marka>
                            <ID>7777</ID>
                        </Marka>
                    </Body>
                </Envelope>
            `;

            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                text: async () => mockXml
            });

            const response = await POST(request);
            const data = await response.json();

            expect(data.success).toBe(true);
            expect(data.brand.ticimaxId).toBe(7777);
        });

        it('should extract error message if ID not found', async () => {
            const request = new Request('http://test/api', {
                method: 'POST',
                body: JSON.stringify({ name: 'Error Case' })
            });

            const mockXml = `
                <Envelope>
                    <Body>
                        <Hata>Bu marka adı zaten kullanılıyor</Hata>
                    </Body>
                </Envelope>
            `;

            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                text: async () => mockXml
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error).toBe('Bu marka adı zaten kullanılıyor');
        });

        it('should handle Ticimax save error (status not ok)', async () => {
            const request = new Request('http://test/api', {
                method: 'POST',
                body: JSON.stringify({ name: 'Fail Case' })
            });

            global.fetch = vi.fn().mockResolvedValue({
                ok: false,
                text: async () => 'Critical SOAP failure'
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data.error).toBe('Ticimax kayıt hatası');
        });

        it('should handle runtime exceptions in POST (catch block)', async () => {
            const request = new Request('http://test/api', {
                method: 'POST',
                body: JSON.stringify({ name: 'Crash Case' })
            });

            global.fetch = vi.fn().mockImplementation(() => {
                throw new Error("Crash");
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data.error).toBe('Marka eklenemedi');
        });
    });
});
