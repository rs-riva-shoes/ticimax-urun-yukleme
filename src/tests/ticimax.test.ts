import { describe, it, expect } from 'vitest';
import { sanitizeTurkish } from '@/utils';

interface MockVariant {
    color: string;
    size: string;
    qty: number;
    barcode?: string;
}

interface MockProduct {
    title?: string;
    productCode: string;
    descriptionHtml?: string;
    price: { sale: number };
    variants: MockVariant[];
}

/**
 * Ticimax'a gönderilen verinin iç yapısındaki 
 * dönüşüm mantığını simüle eden test fonksiyonu
 */
function transformForTicimax(product: MockProduct) {
    return {
        Isim: product.title,
        UrunKodu: product.productCode,
        Aciklama: product.descriptionHtml,
        Aktif: true,
        Varyantlar: product.variants.map((v: MockVariant) => ({
            Barkod: v.barcode || `${product.productCode}-${sanitizeTurkish(v.color)}-${sanitizeTurkish(v.size)}`,
            StokAdedi: v.qty,
            SatisFiyati: product.price.sale,
            EkSecenekOzellik: v.color, // Renk
            EkSecenekDeger: v.size      // Beden
        }))
    };
}


describe('Ticimax Data Transformation Logic (Core Functions Test)', () => {

    it('should correctly transform internal product to Ticimax format', () => {
        const product = {
            title: "Hakiki Deri Sneaker",
            productCode: "ARS-001",
            price: { sale: 1500 },
            variants: [
                { color: "Siyah", size: "42", qty: 5 }
            ]
        };

        const result = transformForTicimax(product);

        expect(result.Isim).toBe("Hakiki Deri Sneaker");
        expect(result.Varyantlar[0].Barkod).toBe("ARS-001-SIYAH-42");
        expect(result.Varyantlar[0].StokAdedi).toBe(5);
        expect(result.Varyantlar[0].SatisFiyati).toBe(1500);
    });

    it('should handle special characters during transformation', () => {
        const product = {
            productCode: "BOT-01",
            price: { sale: 1000 },
            variants: [{ color: "Gümüş", size: "38-A", qty: 1 }]
        };

        const result = transformForTicimax(product);
        // Gümüş -> GUMUS olmalı
        expect(result.Varyantlar[0].Barkod).toBe("BOT-01-GUMUS-38-A");
    });

});
