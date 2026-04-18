import { describe, it, expect } from 'vitest';
import { sanitizeTurkish, sanitizeTurkishAlphaOnly, formatPrice } from '@/utils';

describe('Utility Functions (JUnit Style Tests)', () => {
    
    describe('sanitizeTurkish', () => {
        it('should convert Turkish characters to ASCII and keep hyphens', () => {
            const input = "İşçiler-Öğretmenler-Çarşı";
            const output = sanitizeTurkish(input);
            expect(output).toBe("ISCILER-OGRETMENLER-CARSI");
        });

        it('should remove special characters except hyphens', () => {
            const input = "Product! @#Name-123";
            const output = sanitizeTurkish(input);
            expect(output).toBe("PRODUCTNAME-123");
        });

        it('should handle empty strings', () => {
            expect(sanitizeTurkish("")).toBe("");
        });
    });

    describe('sanitizeTurkishAlphaOnly', () => {
        it('should return only alphanumeric characters with max length', () => {
            const input = "SNEAKER AYAKKABI";
            const output = sanitizeTurkishAlphaOnly(input, 3);
            expect(output).toBe("SNE");
        });

        it('should strip everything except A-Z and 0-9', () => {
            const input = "Brand-123!";
            const output = sanitizeTurkishAlphaOnly(input, 5);
            expect(output).toBe("BRAND");
        });
    });

    describe('formatPrice', () => {
        it('should format numbers to Turkish Lira', () => {
            const output = formatPrice(1250.50);
            // Result contains non-breaking space and currency symbol
            expect(output).toContain("1.250,50");
            expect(output).toContain("₺");
        });
    });

});
