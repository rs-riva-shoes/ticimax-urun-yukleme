import { describe, it, expect } from 'vitest';
import { validatePushPayload } from '@/utils';
import type { PushPayload } from '@/types';


describe('Ticimax Payload Validation Tests', () => {

    it('should fail if title is missing', () => {
        const payload = { title: "", categoryId: "1", brandId: "1" };
        const result = validatePushPayload(payload as Partial<PushPayload>);
        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.field === "title")).toBe(true);
    });

    it('should fail if no category is selected', () => {
        const payload = { title: "Test Product", brandId: "1" };
        const result = validatePushPayload(payload as Partial<PushPayload>);
        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.field === "category")).toBe(true);
    });

    it('should fail if price is zero or negative', () => {
        const payload = { title: "Test", categoryId: "1", brandId: "1", price: { sale: 0 } as any };
        const result = validatePushPayload(payload as Partial<PushPayload>);
        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.field === "price")).toBe(true);
    });

    it('should fail if variants are empty', () => {
        const payload = { 
            title: "Test", 
            categoryId: "1", 
            brandId: "1", 
            price: { sale: 100 } as any,
            variants: [] 
        };
        const result = validatePushPayload(payload as Partial<PushPayload>);
        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.field === "variants")).toBe(true);
    });

    it('should fail if product code is missing', () => {
        const payload = { 
            title: "Test", 
            categoryId: "1", 
            brandId: "1", 
            price: { sale: 100 } as any,
            variants: [{ size: "38", color: "Siyah", qty: 1 }],
            productCode: "" 
        };
        const result = validatePushPayload(payload as Partial<PushPayload>);
        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.field === "productCode")).toBe(true);
    });

    describe('Variant Validation Edge Cases', () => {
        it('should fail if variant size is empty', () => {
            const payload = { 
                title: "Test", categoryId: "1", brandId: "1", productCode: "X",
                price: { sale: 100 } as any,
                variants: [{ size: " ", color: "Siyah", qty: 1 }] 
            };
            const result = validatePushPayload(payload as Partial<PushPayload>);
            expect(result.isValid).toBe(false);
            expect(result.errors.some(e => e.field === "variants[0].size")).toBe(true);
        });

        it('should fail if variant color is empty', () => {
            const payload = { 
                title: "Test", categoryId: "1", brandId: "1", productCode: "X",
                price: { sale: 100 } as any,
                variants: [{ size: "38", color: "", qty: 1 }] 
            };
            const result = validatePushPayload(payload as Partial<PushPayload>);
            expect(result.isValid).toBe(false);
            expect(result.errors.some(e => e.field === "variants[0].color")).toBe(true);
        });

        it('should fail if variant qty is negative', () => {
            const payload = { 
                title: "Test", categoryId: "1", brandId: "1", productCode: "X",
                price: { sale: 100 } as any,
                variants: [{ size: "38", color: "Siyah", qty: -5 }] 
            };
            const result = validatePushPayload(payload as Partial<PushPayload>);
            expect(result.isValid).toBe(false);
            expect(result.errors.some(e => e.field === "variants[0].qty")).toBe(true);
        });
    });

    it('should pass with all required fields', () => {
        const payload = { 
            title: "Test Product", 
            categoryId: "1", 
            brandId: "1", 
            productCode: "MODEL-001",
            price: { sale: 100 } as any,
            variants: [{ size: "38", color: "Siyah", qty: 10 }] 
        };
        const result = validatePushPayload(payload as Partial<PushPayload>);
        expect(result.isValid).toBe(true);
    });

});
