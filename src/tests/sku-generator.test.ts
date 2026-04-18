import { describe, it, expect } from 'vitest';
import { generateProfessionalSKU, generateSKU } from '@/services/sku-generator';

describe('Server-Side SKU Generator Tests', () => {

    describe('generateProfessionalSKU', () => {
        it('should match the [BRAND]-[CAT]-[GENDER]-[YEAR]-[SEQ] pattern', () => {
            const result = generateProfessionalSKU({
                brandName: "Arslan",
                categoryName: "Terlik",
                gender: "Kadin",
                totalCount: 99
            });

            // 99 + 1 = 100
            expect(result).toMatch(/^ARS-TER-K-\d{2}-100$/);
        });

        it('should use U for unknown gender', () => {
            const result = generateProfessionalSKU({
                brandName: "Nike",
                categoryName: "Sneaker",
                totalCount: 0
            });
            expect(result).toMatch(/^NIK-SNE-U-\d{2}-001$/);
        });

        it('should handle Erkek gender correctly', () => {
            const result = generateProfessionalSKU({
                brandName: "Adidas",
                categoryName: "Kosu",
                gender: "Erkek",
                totalCount: 10
            });
            expect(result).toContain("-E-");
        });

        it('should handle Cocuk/Bebek gender correctly', () => {
            const result = generateProfessionalSKU({
                brandName: "Puma",
                categoryName: "Bot",
                gender: "Cocuk",
                totalCount: 5
            });
            expect(result).toContain("-C-");
        });
    });

    describe('generateSKU (Variant specific)', () => {
        it('should generate a detailed variant SKU correctly', () => {
            const result = generateSKU({
                categoryId: "123",
                categoryName: "Kadın Ayakkabı",
                size: "38",
                color: "Siyah",
                sequence: 1
            });

            // RV-K-KA-38-SIY-YYYYMM-0001
            expect(result).toMatch(/^RV-K-KA-38-SIY-\d{6}-0001$/);
        });

        it('should handle Erkek category and 4-digit sequence', () => {
            const result = generateSKU({
                categoryId: "456",
                categoryName: "Erkek Bot",
                size: "44",
                color: "Kahverengi",
                sequence: 1234
            });

            expect(result).toMatch(/^RV-E-ER-44-KAH-\d{6}-1234$/);
        });

        it('should handle Cocuk categories', () => {
             const result = generateSKU({
                categoryId: "789",
                categoryName: "Cocuk Sandalet",
                size: "25",
                color: "Mavi",
                sequence: 55
            });
            expect(result).toContain("RV-C-CO-");
        });
    });

});
