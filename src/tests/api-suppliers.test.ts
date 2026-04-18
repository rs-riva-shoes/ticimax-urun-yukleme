import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/settings/suppliers/route';
import { NextResponse } from 'next/server';

// Mock Config
vi.mock('@/config/env', () => ({
    env: {
        TICIMAX_DOMAIN: 'https://test.com',
        TICIMAX_USER: 'TEST_USER'
    }
}));

describe('API: /api/settings/suppliers', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('GET - List Suppliers', () => {
        it('should fetch and parse suppliers successfully', async () => {
            const mockXml = `
                <Envelope>
                    <Body>
                        <SelectTedarikciResponse>
                            <SelectTedarikciResult>
                                <Tedarikci>
                                    <ID>10</ID>
                                    <Tanim>Test Tedarikcim</Tanim>
                                </Tedarikci>
                            </SelectTedarikciResult>
                        </SelectTedarikciResponse>
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
            expect(data).toHaveLength(1);
            expect(data[0].name).toBe('Test Tedarikcim');
            expect(data[0].ticimaxId).toBe(10);
        });

        it('should handle configuration errors (missing user)', async () => {
            const { env } = await import('@/config/env');
            const originalUser = env.TICIMAX_USER;
            // @ts-ignore
            env.TICIMAX_USER = '';

            const response = await GET();
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data.error).toContain('Ayarları eksik');

            // @ts-ignore
            env.TICIMAX_USER = originalUser;
        });

        it('should handle Ticimax connection errors (status not ok)', async () => {
            global.fetch = vi.fn().mockResolvedValue({
                ok: false,
                status: 500,
                text: async () => 'Internal Server Error'
            });

            const response = await GET();
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data.error).toBe('Ticimax bağlantı hatası');
        });

        it('should handle runtime exceptions (catch block)', async () => {
            global.fetch = vi.fn().mockImplementation(() => {
                throw new Error("Network Crash");
            });

            const response = await GET();
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data.error).toBe('Tedarikçiler alınamadı');
        });
    });

    describe('POST - Create Supplier', () => {
        it('should create supplier and escape XML characters', async () => {
            const request = new Request('http://test/api', {
                method: 'POST',
                body: JSON.stringify({ name: 'Alpha & "Beta" <Gamma>' })
            });

            const mockXml = `
                <Envelope>
                    <Body>
                        <SaveTedarikciResponse>
                            <SaveTedarikciResult>999</SaveTedarikciResult>
                        </SaveTedarikciResponse>
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
            expect(data.supplier.ticimaxId).toBe(999);
        });

        it('should handle missing name validation', async () => {
            const request = new Request('http://test/api', {
                method: 'POST',
                body: JSON.stringify({ name: '' })
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error).toBe('Tedarikçi adı zorunlu');
        });

        it('should fallback to inner ID if SaveTedarikciResult is 0', async () => {
             const request = new Request('http://test/api', {
                method: 'POST',
                body: JSON.stringify({ name: 'Fallback Test' })
            });

            const mockXml = `
                <Envelope>
                    <Body>
                        <SaveTedarikciResponse>
                            <SaveTedarikciResult>0</SaveTedarikciResult>
                            <Tedarikci>
                                <ID>456</ID>
                            </Tedarikci>
                        </SaveTedarikciResponse>
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
            expect(data.supplier.ticimaxId).toBe(456);
        });

        it('should extract error message if ID not found', async () => {
            const request = new Request('http://test/api', {
                method: 'POST',
                body: JSON.stringify({ name: 'Error Test' })
            });

            const mockXml = `
                <Envelope>
                    <Body>
                        <SaveTedarikciResponse>
                            <SaveTedarikciResult>0</SaveTedarikciResult>
                            <Message>Kayıt zaten mevcut</Message>
                        </SaveTedarikciResponse>
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
            expect(data.error).toBe('Kayıt zaten mevcut');
        });

        it('should handle Ticimax save error (status not ok)', async () => {
            const request = new Request('http://test/api', {
                method: 'POST',
                body: JSON.stringify({ name: 'Fail Test' })
            });

            global.fetch = vi.fn().mockResolvedValue({
                ok: false,
                text: async () => 'SOAP Error XYZ'
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data.error).toBe('Ticimax kayıt hatası');
        });

        it('should handle runtime exceptions in POST (catch block)', async () => {
             const request = new Request('http://test/api', {
                method: 'POST',
                body: JSON.stringify({ name: 'Crash Test' })
            });

            global.fetch = vi.fn().mockImplementation(() => {
                throw new Error("Crash");
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data.error).toBe('Tedarikçi eklenemedi');
        });
    });
});
