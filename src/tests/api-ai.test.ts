import { describe, it, expect, vi } from 'vitest';
import { POST as analyzePOST } from '@/app/api/ai/analyze-product/route';
import { POST as predictPOST } from '@/app/api/ai/predict-category/route';
import { POST as suggestPOST } from '@/app/api/ai/suggest-name/route';

// OpenAI Mock
vi.mock('openai', () => {
    return {
        default: class {
            chat = {
                completions: {
                    create: vi.fn().mockResolvedValue({
                        choices: [{ message: { content: '{"brand":"test","title":"test","productTypeCategoryId":"1","hierarchicalCategoryIds":["1"]}' } }]
                    })
                }
            }
        }
    };
});

// Mock config/env to prevent 400/500
vi.mock('@/config/env', () => ({
    env: { OPENAI_API_KEY: 'test-key' }
}));

describe('AI API Routes (Fixed Payloads)', () => {
    describe('Analyze Product', () => {
        it('should return analysis with correct payload', async () => {
            const req = new Request('http://localhost/api/ai/analyze-product', {
                method: 'POST', 
                body: JSON.stringify({ 
                    images: ['data:image/png;base64,123'],
                    categories: [{ id: '1', name: 'Ayakkabı' }],
                    attributes: []
                })
            });
            const response = await analyzePOST(req);
            const data = await response.json();
            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
        });
    });

    describe('Predict Category', () => {
        it('should predict category from text', async () => {
             const req = new Request('http://localhost/api/ai/predict-category', {
                method: 'POST', 
                body: JSON.stringify({ 
                    title: 'Spor Ayakkabı', 
                    categories: [{ id: '1', name: 'Ayakkabı' }] 
                })
            });
            const response = await predictPOST(req);
            expect(response.status).toBe(200);
        });
    });

    describe('Suggest Name', () => {
        it('should suggest name from images', async () => {
             const req = new Request('http://localhost/api/ai/suggest-name', {
                method: 'POST', 
                body: JSON.stringify({ 
                    images: ['data:image/png;base64,123'] 
                })
            });
            const response = await suggestPOST(req);
            expect(response.status).toBe(200);
        });
    });
});
