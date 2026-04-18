import { describe, it, expect } from 'vitest';
import { sanitizeTurkish } from './utils';

// Isolated barcode logic from VariantManager
function generateBarcode(code: string, color: string, size: string) {
    if (!code) return "";
    const cleanCode = sanitizeTurkish(code);
    const cleanColor = color ? sanitizeTurkish(color) : "";
    const cleanSize = size ? sanitizeTurkish(size) : "";
    
    let barcode = cleanCode;
    if (cleanColor) barcode += `-${cleanColor}`;
    if (cleanSize) barcode += `-${cleanSize}`;
    
    return barcode;
}

describe('Complex Barcode Logic Tests', () => {

    it('should generate barcode with all parts sanitized', () => {
        const barcode = generateBarcode("ARS-SNK-24", "Mavi Renk", "38-Numara");
        // Expecting spaces to be removed and Turkish chars converted
        expect(barcode).toBe("ARS-SNK-24-MAVIRENK-38-NUMARA");
    });

    it('should handle missing color or size gracefully', () => {
        expect(generateBarcode("MODEL-X", "", "38")).toBe("MODEL-X-38");
        expect(generateBarcode("MODEL-X", "Siyah", "")).toBe("MODEL-X-SIYAH");
    });

    it('should handle weird characters by stripping them', () => {
        const barcode = generateBarcode("MOD@EL#", "Bahar!Çiçeği", "XXL+");
        expect(barcode).toBe("MODEL-BAHARCICEGI-XXL");
    });

});
