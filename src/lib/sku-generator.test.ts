import { describe, it, expect } from 'vitest';
import { generateProfessionalSKU } from './sku-generator';

describe('Server-Side SKU Generator Tests', () => {

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

});
