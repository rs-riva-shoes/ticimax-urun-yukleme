"use client";

import { useState } from "react";
import Link from "next/link";
import { Edit, Trash2, ChevronDown, Package } from "lucide-react";

interface Variant {
    size?: string;
    color?: string;
    qty?: number;
    sku?: string;
    barcode?: string;
}

interface ProductCardProps {
    product: {
        id: string;
        title?: string;
        brandName?: string;
        categoryName?: string;
        images?: string[];
        price?: { sale?: number };
        variants?: Variant[];
        status?: string;
    };
}

export function ProductCard({ product }: ProductCardProps) {
    const [expanded, setExpanded] = useState(false);
    const variants = product.variants || [];
    const hasVariants = variants.length > 0;

    // Group variants by color
    const colorGroups: Record<string, Variant[]> = {};
    variants.forEach((v) => {
        const color = v.color || "Renksiz";
        if (!colorGroups[color]) colorGroups[color] = [];
        colorGroups[color].push(v);
    });

    return (
        <div className="product-card group">
            {/* Image */}
            <div className="aspect-square relative bg-stone-100 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={
                        product.images?.[0] ||
                        "https://via.placeholder.com/400x400?text=No+Image"
                    }
                    alt={product.title || "Ürün"}
                    className="product-image object-cover w-full h-full"
                />
                {/* Price */}
                <div className="absolute top-3 right-3 price-tag">
                    {product.price?.sale
                        ? `${Number(product.price.sale).toLocaleString("tr-TR")} ₺`
                        : "–"}
                </div>
                {/* Status Badge */}
                {product.status && (
                    <div className={`absolute top-3 left-3 text-[10px] font-bold px-2 py-0.5 rounded-full ${product.status === "published"
                            ? "bg-emerald-500 text-white"
                            : "bg-stone-200 text-stone-600"
                        }`}>
                        {product.status === "published" ? "Yayında" : "Taslak"}
                    </div>
                )}
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <Link href={`/products/edit/${product.id}`}>
                        <button className="w-10 h-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition-colors shadow-lg">
                            <Edit className="w-4 h-4 text-stone-700" />
                        </button>
                    </Link>
                    <button className="w-10 h-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition-colors shadow-lg">
                        <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                </div>
            </div>

            {/* Info */}
            <div className="p-3.5">
                <h3 className="font-semibold text-sm text-stone-800 line-clamp-1 group-hover:text-amber-700 transition-colors">
                    {product.title || "İsimsiz Ürün"}
                </h3>
                <p className="text-xs text-stone-400 mt-0.5 line-clamp-1">
                    {product.brandName || "Markasız"}
                </p>
                <div className="flex items-center justify-between mt-2">
                    <span className="badge-gold text-[11px]">
                        {product.categoryName || "Kategori yok"}
                    </span>
                    {/* Variant toggle button */}
                    {hasVariants ? (
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className="flex items-center gap-1 text-xs text-stone-500 hover:text-amber-600 transition-colors"
                        >
                            <span>{variants.length} varyant</span>
                            <ChevronDown
                                className={`w-3.5 h-3.5 transition-transform duration-200 ${expanded ? "rotate-180" : ""
                                    }`}
                            />
                        </button>
                    ) : (
                        <span className="text-xs text-stone-400">0 varyant</span>
                    )}
                </div>
            </div>

            {/* Expandable Variants Panel */}
            {expanded && hasVariants && (
                <div className="border-t border-stone-100 bg-stone-50/50">
                    <div className="p-3 space-y-2 max-h-48 overflow-y-auto">
                        {Object.entries(colorGroups).map(([color, items]) => (
                            <div key={color}>
                                <div className="flex items-center gap-1.5 mb-1">
                                    <div
                                        className="w-2.5 h-2.5 rounded-full border border-stone-300"
                                        style={{
                                            backgroundColor: getColorHex(color),
                                        }}
                                    />
                                    <span className="text-[11px] font-semibold text-stone-600 uppercase">
                                        {color}
                                    </span>
                                    <span className="text-[10px] text-stone-400">
                                        ({items.reduce((s, v) => s + (v.qty || 0), 0)} adet)
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-1 ml-4">
                                    {items.map((v, i) => (
                                        <span
                                            key={i}
                                            className={`text-[10px] px-1.5 py-0.5 rounded border ${(v.qty || 0) > 0
                                                    ? "bg-white border-stone-200 text-stone-700"
                                                    : "bg-red-50 border-red-200 text-red-400 line-through"
                                                }`}
                                        >
                                            {v.size || "?"} × {v.qty || 0}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* Summary bar */}
                    <div className="px-3 py-2 border-t border-stone-100 flex items-center justify-between bg-amber-50/50">
                        <span className="text-[10px] text-stone-500">
                            {Object.keys(colorGroups).length} renk · {variants.length} varyant
                        </span>
                        <span className="text-[10px] font-bold text-amber-700">
                            Toplam: {variants.reduce((s, v) => s + (v.qty || 0), 0)} adet
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}

/** Simple color name → hex mapper for the dot indicator */
function getColorHex(color: string): string {
    const map: Record<string, string> = {
        siyah: "#1a1a1a", black: "#1a1a1a",
        beyaz: "#ffffff", white: "#ffffff",
        kirmizi: "#ef4444", red: "#ef4444", kırmızı: "#ef4444",
        mavi: "#3b82f6", blue: "#3b82f6",
        yesil: "#22c55e", green: "#22c55e", yeşil: "#22c55e",
        sari: "#eab308", yellow: "#eab308", sarı: "#eab308",
        pembe: "#ec4899", pink: "#ec4899",
        mor: "#8b5cf6", purple: "#8b5cf6",
        turuncu: "#f97316", orange: "#f97316",
        gri: "#9ca3af", gray: "#9ca3af", grey: "#9ca3af",
        kahverengi: "#92400e", brown: "#92400e",
        lacivert: "#1e3a5f", navy: "#1e3a5f",
        bej: "#d4b896", beige: "#d4b896",
        krem: "#fffdd0", cream: "#fffdd0",
        bordo: "#800020",
        fuşya: "#ff00ff", fusya: "#ff00ff",
        haki: "#8b7355", khaki: "#8b7355",
    };
    return map[color.toLowerCase().trim()] || "#d4d4d4";
}
