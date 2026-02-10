/**
 * SKU Generation Utilities
 * Format: RV-{GENDER}-{CATEGORY}-{SIZE}-{COLOR}-{YYYYMM}-{SEQ}
 * SKU also serves as barcode (no separate barcode needed)
 */

// Category code mapping
const CATEGORY_CODES: Record<string, string> = {
    "101": "CB",  // Çanta (Bag)
    "102": "AS",  // Ayakkabı (Shoe)
    "103": "SD",  // Sandalet
    "104": "TR",  // Terlik
    "105": "BT",  // Bot (Boot)
    "106": "AS",  // Ayakkabı
    "107": "BT",  // Bot
    "108": "AS",  // Ayakkabı
    "201": "NS",  // Yeni Sezon (New Season)
    "202": "SC",  // İndirimli (Sale/Clearance)
};

// Color code mapping (Turkish colors to 3-letter codes)
const COLOR_CODES: Record<string, string> = {
    "siyah": "SYH",
    "beyaz": "BYZ",
    "kırmızı": "KRM",
    "mavi": "MAV",
    "yeşil": "YSL",
    "sarı": "SAR",
    "turuncu": "TRN",
    "mor": "MOR",
    "pembe": "PMB",
    "gri": "GRI",
    "kahverengi": "KHV",
    "lacivert": "LAC",
    "bej": "BEJ",
    "bordo": "BRD",
    "hardal": "HRD",
    "haki": "HKI",
    "vizon": "VZN",
    "füme": "FUM",
    "ekru": "EKR",
    "mint": "MNT",
    "pudra": "PDR",
    "gold": "GLD",
    "gümüş": "GMS",
    "bronz": "BRZ",
    "rose": "RSE",
    "leopar": "LEO",
    "desenli": "DSN",
    "multi": "MLT",
};

// Gender extraction from category name
export function extractGenderCode(categoryName: string): string {
    const nameLower = categoryName.toLowerCase();
    if (nameLower.includes("kadın")) return "K";
    if (nameLower.includes("erkek")) return "E";
    if (nameLower.includes("çocuk")) return "C";
    if (nameLower.includes("unisex")) return "U";
    return "U"; // Default to Unisex
}

// Get category code
export function getCategoryCode(categoryId: string): string {
    return CATEGORY_CODES[categoryId] || "XX";
}

// Normalize color to code
export function getColorCode(color: string): string {
    if (!color) return "XXX";

    const colorLower = color.toLowerCase().trim();

    // Direct match
    if (COLOR_CODES[colorLower]) {
        return COLOR_CODES[colorLower];
    }

    // Partial match
    for (const [key, code] of Object.entries(COLOR_CODES)) {
        if (colorLower.includes(key) || key.includes(colorLower)) {
            return code;
        }
    }

    // If no match, create 3-letter code from first 3 chars
    return color.substring(0, 3).toUpperCase().padEnd(3, 'X');
}

// Normalize size to code
export function getSizeCode(size: string | number): string {
    if (!size) return "XX";

    const sizeStr = String(size).trim();

    // Numeric sizes (shoe sizes, etc.)
    if (/^\d+$/.test(sizeStr)) {
        return sizeStr.padStart(2, '0').substring(0, 2);
    }

    // Clothing sizes (S, M, L, XL, etc.)
    const clothingSizes: Record<string, string> = {
        "xs": "XS",
        "s": "SM",
        "m": "MD",
        "l": "LG",
        "xl": "XL",
        "xxl": "XX",
        "xxxl": "3X",
    };

    const sizeLower = sizeStr.toLowerCase();
    if (clothingSizes[sizeLower]) {
        return clothingSizes[sizeLower];
    }

    // Default: take first 2 chars
    return sizeStr.substring(0, 2).toUpperCase().padEnd(2, 'X');
}

// Generate SKU
export interface SKUParams {
    categoryId: string;
    categoryName: string;
    size: string | number;
    color: string;
    sequence: number;
}

export function generateSKU(params: SKUParams): string {
    const { categoryId, categoryName, size, color, sequence } = params;

    // Extract components
    const gender = extractGenderCode(categoryName);
    const category = getCategoryCode(categoryId);
    const sizeCode = getSizeCode(size);
    const colorCode = getColorCode(color);

    // Date period
    const date = new Date();
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const period = `${yyyy}${mm}`;

    // Sequence (4 digits)
    const seq = String(sequence).padStart(4, '0');

    // Format: RV-{GENDER}-{CATEGORY}-{SIZE}-{COLOR}-{YYYYMM}-{SEQ}
    // Example: RV-K-AS-38-SYH-202602-0001
    return `RV-${gender}-${category}-${sizeCode}-${colorCode}-${period}-${seq}`;
}

// Validate SKU format
export function validateSKU(sku: string): boolean {
    // Format: RV-X-XX-XX-XXX-YYYYMM-XXXX
    const pattern = /^RV-[A-Z]-[A-Z]{2}-[A-Z0-9]{2}-[A-Z0-9]{3}-\d{6}-\d{4}$/;
    return pattern.test(sku);
}

// Parse SKU back to components
export interface SKUComponents {
    prefix: string;
    gender: string;
    category: string;
    size: string;
    color: string;
    period: string;
    sequence: string;
}

export function parseSKU(sku: string): SKUComponents | null {
    if (!validateSKU(sku)) return null;

    const parts = sku.split('-');
    return {
        prefix: parts[0],
        gender: parts[1],
        category: parts[2],
        size: parts[3],
        color: parts[4],
        period: parts[5],
        sequence: parts[6],
    };
}
