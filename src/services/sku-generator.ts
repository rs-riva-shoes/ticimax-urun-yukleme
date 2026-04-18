import { sanitizeTurkishAlphaOnly } from '@/utils';

export interface SKUParams {
    brandName: string;
    categoryName: string;
    gender?: string;
    totalCount: number;
}

export interface VariantSKUParams {
    categoryId: string;
    categoryName: string;
    size: string;
    color: string;
    sequence: number;
}

/**
 * Üretim Standartı: [MARKA]-[KAT]-[CİNSİYET]-[YIL]-[SIRA]
 * Örn: ARS-SNK-K-24-001
 */
export function generateProfessionalSKU(params: SKUParams): string {
    const { brandName, categoryName, gender, totalCount } = params;

    const brandCode = sanitizeTurkishAlphaOnly(brandName, 3);
    const catCode = sanitizeTurkishAlphaOnly(categoryName, 3);

    let genderCode = "U";
    const g = gender?.toUpperCase() || "";
    if (g.includes("KADIN")) genderCode = "K";
    else if (g.includes("ERKEK")) genderCode = "E";
    else if (g.includes("COCUK") || g.includes("BEBEK")) genderCode = "C";

    const year = new Date().getFullYear().toString().slice(-2);
    const sequence = (totalCount + 1).toString().padStart(3, '0');

    return `${brandCode}-${catCode}-${genderCode}-${year}-${sequence}`;
}

/**
 * Varyant Spesifik SKU Oluşturucu (Route.ts tarafından kullanılır)
 * Format: RV-{GENDER}-{CATEGORY}-{SIZE}-{COLOR}-{YYYYMM}-{SEQ}
 * Örn: RV-K-AS-38-SYH-202602-0001
 */
export function generateSKU(params: VariantSKUParams): string {
    const { categoryName, size, color, sequence } = params;

    // Kategoriye göre cinsiyet belirle
    let genderCode = "U";
    const cat = categoryName.toUpperCase();
    if (cat.includes("KADIN")) genderCode = "K";
    else if (cat.includes("ERKEK")) genderCode = "E";
    else if (cat.includes("COCUK") || cat.includes("BEBEK")) genderCode = "C";

    // Kategori kısaltması
    const catCode = sanitizeTurkishAlphaOnly(categoryName, 2); // 2 harf örn: AS (Ayakkabı/Sneaker)
    
    // Renk kısaltması (İlk 3 harf)
    const colorCode = sanitizeTurkishAlphaOnly(color, 3);

    // Tarih periyodu
    const date = new Date();
    const period = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    // Sıra no (4 hane)
    const seqStr = sequence.toString().padStart(4, '0');

    return `RV-${genderCode}-${catCode}-${size}-${colorCode}-${period}-${seqStr}`;
}
