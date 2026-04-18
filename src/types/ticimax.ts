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
    colorSettings: Record<string, import('./product').ColorSetting>;
    price: import('./product').ProductPrice;
    dimensions: import('./product').ProductDimensions;
    variants: import('./product').EnrichedVariant[];
    selectedAttributes: import('./product').SelectedAttribute[];
    images?: string[];
    _meta: {
        imageCount: number;
        totalStock: number;
    };
}
