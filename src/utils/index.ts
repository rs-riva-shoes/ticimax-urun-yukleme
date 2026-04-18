import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { PushPayload, ValidationResult } from "@/types";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Türkçe karakterleri ASCII karşılıklarına dönüştürür ve alfanümerik olmayan karakterleri temizler.
 * Kullanım: Barkod, SKU, stok kodu oluşturma.
 */
export function sanitizeTurkish(text: string): string {
    if (!text) return "";
    return text
        .toUpperCase()
        .replace(/İ/g, "I")
        .replace(/Ğ/g, "G")
        .replace(/Ü/g, "U")
        .replace(/Ş/g, "S")
        .replace(/Ö/g, "O")
        .replace(/Ç/g, "C")
        .replace(/[^A-Z0-9-]/g, "");
}

/**
 * Türkçe karakterleri dönüştürür ama sadece harf ve rakam bırakır (tire hariç).
 * Kullanım: Model kodu oluşturmada kısa kod türetme.
 */
export function sanitizeTurkishAlphaOnly(text: string, maxLength = 3): string {
    if (!text) return "";
    return text
        .toUpperCase()
        .replace(/İ/g, "I")
        .replace(/Ğ/g, "G")
        .replace(/Ü/g, "U")
        .replace(/Ş/g, "S")
        .replace(/Ö/g, "O")
        .replace(/Ç/g, "C")
        .replace(/[^A-Z0-9]/g, "")
        .substring(0, maxLength);
}

/**
 * Ticimax'a gönderilecek payload'ı validate eder.
 * Hem client tarafında (buton tıklamadan önce) hem API route'ta kullanılabilir.
 */
export function validatePushPayload(payload: Partial<PushPayload>): ValidationResult {
    const errors: ValidationResult["errors"] = [];

    if (!payload.title?.trim()) {
        errors.push({ field: "title", message: "Ürün adı boş olamaz." });
    }

    if (!payload.categoryId && !payload.productTypeCategoryId) {
        errors.push({ field: "category", message: "En az bir kategori seçilmelidir." });
    }

    if (!payload.brandId) {
        errors.push({ field: "brand", message: "Marka seçilmelidir." });
    }

    if (!payload.price || payload.price.sale <= 0) {
        errors.push({ field: "price", message: "Satış fiyatı 0'dan büyük olmalıdır." });
    }

    if (!payload.variants || payload.variants.length === 0) {
        errors.push({ field: "variants", message: "En az bir varyant eklenmelidir." });
    } else {
        payload.variants.forEach((v, i) => {
            if (!v.size?.trim()) {
                errors.push({ field: `variants[${i}].size`, message: `Varyant ${i + 1}: Beden boş olamaz.` });
            }
            if (!v.color?.trim()) {
                errors.push({ field: `variants[${i}].color`, message: `Varyant ${i + 1}: Renk boş olamaz.` });
            }
            if (v.qty < 0) {
                errors.push({ field: `variants[${i}].qty`, message: `Varyant ${i + 1}: Stok negatif olamaz.` });
            }
        });
    }

    if (!payload.productCode?.trim()) {
        errors.push({ field: "productCode", message: "Model/Stok kodu girilmelidir." });
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

/**
 * Para birimi formatlaması (Türk Lirası).
 */
export function formatPrice(price: number): string {
    return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(price);
}
