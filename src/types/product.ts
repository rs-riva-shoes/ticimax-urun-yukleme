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

export interface EnrichedVariant extends ProductVariant {
    image: string;
    images: string[];
    customTitle: string;
}

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

export interface ColorSetting {
    imageIndices: number[];
    title: string;
}
