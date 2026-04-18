/**
 * Shared type definitions for the Ticimax panel.
 * All domain types should be defined here to avoid duplication and `any` usage.
 */

// ─── Product ────────────────────────────────────────────────────────

export interface Product {
    id: string;
    title?: string;
    description?: string;
    productCode?: string;
    ticimaxId?: number;
    brandName?: string;
    brandId?: string;
    categoryName?: string;
    categoryId?: string;
    supplierId?: string;
    images?: string[];
    price?: ProductPrice;
    dimensions?: ProductDimensions;
    variants?: ProductVariant[];
    selectedAttributes?: SelectedAttribute[];
    status?: "draft" | "published";
    createdAt?: string | FirestoreTimestamp;
    updatedAt?: string;
    _meta?: { totalStock: number; imageCount?: number };
}

export interface FirestoreTimestamp {
    _seconds?: number;
    seconds?: number;
}

export interface ProductPrice {
    purchase: number;
    sale: number;
    discount: number;
    tax: number;
    currency: string;
}

export interface ProductDimensions {
    width: number;
    height: number;
    depth: number;
    weight: number;
}

// ─── Variants ───────────────────────────────────────────────────────

export interface ProductVariant {
    size: string;
    color: string;
    qty: number;
    sku?: string;
    barcode?: string;
    image?: string;
    images?: string[];
    customTitle?: string;
}

/** Extended variant with all runtime fields added during payload preparation */
export interface EnrichedVariant extends ProductVariant {
    image: string;
    images: string[];
    customTitle: string;
}

// ─── Ticimax Product Row (fetched from Ticimax, different shape) ────

export interface TicimaxVariant {
    id: number;
    sku: string;
    barcode: string;
    price: number;
    stock: number;
    active: boolean;
    images?: string[];
    options: { type: string; value: string }[];
}

export interface TicimaxProduct {
    id: string;
    ticimaxId: number;
    title: string;
    sku?: string;
    images: string[];
    price: { sale: number; buying?: number };
    status: string;
    brandName?: string;
    categoryName?: string;
    variants: TicimaxVariant[];
    _meta?: { totalStock: number };
}

// ─── Attributes ─────────────────────────────────────────────────────

export interface AttributeValue {
    valueId: number;
    name: string;
}

export interface Attribute {
    featureId: number;
    name: string;
    groupId?: number;
    values: AttributeValue[];
}

export interface SelectedAttribute {
    featureId: string;
    valueId: string;
    name?: string;
    valueName?: string;
    groupId?: number;
}

// ─── Brand & Supplier ───────────────────────────────────────────────

export interface Brand {
    id?: string;
    ticimaxId?: number;
    name: string;
}

export interface Supplier {
    id?: string;
    ticimaxId?: number;
    name: string;
}

// ─── Color Settings ─────────────────────────────────────────────────

export interface ColorSetting {
    imageIndices: number[];
    title: string;
}

// ─── Payload (sent to Push API) ─────────────────────────────────────

export interface PushPayload {
    title: string;
    description: string;
    productCode: string;
    ticimaxId?: number;
    categoryId: string;
    categoryName: string;
    brandId: string;
    brandName: string;
    supplierId: string;
    hierarchicalCategoryIds: string[];
    hierarchicalCategoryName: string;
    productTypeCategoryId: string;
    productTypeCategoryName: string;
    combinedCategoryIds: string[];
    colorSettings: Record<string, ColorSetting>;
    price: ProductPrice;
    dimensions: ProductDimensions;
    variants: EnrichedVariant[];
    selectedAttributes: SelectedAttribute[];
    images?: string[];
    _meta: {
        imageCount: number;
        totalStock: number;
    };
}

// ─── Validation ─────────────────────────────────────────────────────

export interface ValidationError {
    field: string;
    message: string;
}

export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
}
