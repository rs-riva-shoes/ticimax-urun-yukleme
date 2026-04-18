import { describe, it, expect, vi, beforeEach } from 'vitest';

// Global mock state to allow dynamic testing
let mockAiResponseId = "7"; 

const getMockAiData = () => ({
    choices: [{
        message: {
            content: JSON.stringify({
                suggestedTitle: "Arslan Ortopedik Siyah Sneaker",
                productTypeCategoryId: mockAiResponseId, // Dynamic for testing
                hierarchicalCategoryIds: ["1", "5", "99"],
                attributeSelections: { "101": "501", "102": "602" },
                descriptionHtml: "<ul><li>Konforlu</li></ul>"
            })
        }
    }]
});

vi.mock('@/services/openai', () => ({
    openai: {
        chat: {
            completions: {
                create: vi.fn(async () => getMockAiData())
            }
        }
    }
}));

describe('Real World Flows: Production Integrity', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubEnv('TICIMAX_DOMAIN', 'https://test.ticimax.com');
        vi.stubEnv('TICIMAX_USER', 'test-user');
        vi.stubEnv('TICIMAX_PASS', 'test-pass');
        mockAiResponseId = "7"; // Reset to valid ID
    });

    it('Scenario A: Product Create -> Ticimax SOAP Payload Mapping', async () => {
        const { POST } = await import('@/app/api/ticimax/push/route');
        
        let capturedBody = '';
        global.fetch = vi.fn().mockImplementation(async (url, options) => {
            capturedBody = options.body;
            return {
                ok: true,
                text: () => Promise.resolve('<SaveUrunResult>9999</SaveUrunResult>')
            };
        });

        const productPayload = {
            title: "Test Sneaker",
            productCode: "TS-101",
            categoryId: "55",
            price: { sale: 1500, tax: 20, currency: "TL" },
            variants: [
                { sku: "TS-101-42", size: "42", color: "Siyah", qty: 10, barcode: "8680000001" }
            ],
            description: "Harika bir ayakkabı",
            images: ["https://img.com/1.jpg"]
        };

        const res = await POST(new Request('http://l', {
            method: 'POST',
            body: JSON.stringify(productPayload)
        }));

        const data = await res.json();
        expect(data.success).toBe(true);
        expect(capturedBody).toContain('<a:UrunAdi>Test Sneaker</a:UrunAdi>');
        expect(capturedBody).toContain('<a:StokKodu>TS-101</a:StokKodu>');
    });

    it('Scenario B: AI Response -> Internal Data Mapping (Valid ID)', async () => {
        const { POST } = await import('@/app/api/ai/analyze-product/route');
        mockAiResponseId = "7"; // Valid Sneaker ID

        const res = await POST(new Request('http://l', {
            method: 'POST',
            body: JSON.stringify({
                images: ["data:image/jpeg;base64,mock"],
                categories: ["shoes"],
                attributes: []
            })
        }));

        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.categoryId).toBe("7"); // Mapping worked perfectly
        expect(data.descriptionHtml).toContain('<ul><li>');
    });

    it('Scenario C: AI Response Fallback (Invalid ID Validation)', async () => {
        const { POST } = await import('@/app/api/ai/analyze-product/route');
        mockAiResponseId = "999-INVALID"; // Trigger fallback

        const res = await POST(new Request('http://l', {
            method: 'POST',
            body: JSON.stringify({
                images: ["data:image/jpeg;base64,mock"],
                categories: ["shoes"],
                attributes: []
            })
        }));

        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.categoryId).toBe("15"); // Successfully fell back to default category (Loafer)
        expect(data.productTypeCategoryReason).toBeDefined(); // Should have a reason for automatic selection
    });

});
