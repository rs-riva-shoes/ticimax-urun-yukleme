import { describe, it, expect } from 'vitest';
import { sanitizeTurkishAlphaOnly } from './utils';

// Logic from ProductInfo.tsx standardized
function generateSKU(brand: string, category: string, gender: string, totalCount: number) {
    const brandCode = sanitizeTurkishAlphaOnly(brand, 3);
    const catCode = sanitizeTurkishAlphaOnly(category, 3);
    
    let genderCode = "U";
    if (gender?.toUpperCase().includes("KADIN")) genderCode = "K";
    else if (gender?.toUpperCase().includes("ERKEK")) genderCode = "E";
    else if (gender?.toUpperCase().includes("COCUK")) genderCode = "C";

    const year = new Date().getFullYear().toString().slice(-2);
    const sequence = (totalCount + 1).toString().padStart(3, '0');

    return `${brandCode}-${catCode}-${genderCode}-${year}-${sequence}`;
}

describe('SKU Generation Algorithm (JUnit Logic Test)', () => {
    
    it('should generate correct SKU for a Woman Sneaker', () => {
        const sku = generateSKU("Arslan", "Sneaker", "Kadin", 41);
        // Expect: ARS (Brand) - SNE (Cat) - K (Gen) - 24 (Year) - 042 (Seq)
        expect(sku).toMatch(/^ARS-SNE-K-\d{2}-042$/);
    });

    it('should generate correct SKU for a Men Slippers', () => {
        const sku = generateSKU("Nike", "Terlik", "Erkek", 9);
        expect(sku).toMatch(/^NIK-TER-E-\d{2}-010$/);
    });

    it('should default to Unisex if gender unknown', () => {
        const sku = generateSKU("Puma", "Bot", "Unknown", 0);
        expect(sku).toMatch(/^PUM-BOT-U-\d{2}-001$/);
    });

});
