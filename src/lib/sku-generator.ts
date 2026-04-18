import { sanitizeTurkishAlphaOnly } from './utils';

export interface SKUParams {
    brandName: string;
    categoryName: string;
    gender?: string;
    totalCount: number;
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
