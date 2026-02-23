"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, ChevronDown, ChevronUp, ChevronRight, Package, Layers } from "lucide-react";

interface Variant {
    id: number;
    sku: string;
    barcode: string;
    price: number;
    stock: number;
    active: boolean;
    images?: string[];
    options: { type: string; value: string }[];
}

interface Product {
    id: string;
    ticimaxId: number;
    title: string;
    sku?: string;
    images: string[];
    price: { sale: number; buying?: number };
    status: string;
    brandName?: string;
    categoryName?: string;
    variants: Variant[];
    _meta?: { totalStock: number };
}

export default function ProductRow({ product }: { product: Product }) {
    const [isProductExpanded, setIsProductExpanded] = useState(false);
    const [expandedColors, setExpandedColors] = useState<string[]>([]);

    // Group variants by color
    const colorGroups = useMemo(() => {
        const groups: Record<string, Variant[]> = {};

        product.variants.forEach(variant => {
            const colorOption = variant.options.find(opt =>
                opt.type.toLowerCase() === "renk" || opt.type.toLowerCase() === "color"
            );
            const colorName = colorOption?.value || "Standart";

            if (!groups[colorName]) {
                groups[colorName] = [];
            }
            groups[colorName].push(variant);
        });

        return groups;
    }, [product.variants]);

    const toggleColor = (color: string) => {
        setExpandedColors(prev =>
            prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]
        );
    };

    return (
        <>
            {/* Main Product Row */}
            <tr className="border-b hover:bg-muted/30 transition-colors group">
                <td className="p-4">
                    <div className="relative w-12 h-16 bg-muted rounded-lg overflow-hidden border shadow-sm group-hover:shadow-md transition-shadow">
                        {product.images?.[0] ? (
                            <Image
                                src={product.images[0]}
                                alt={product.title}
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-[10px] text-muted-foreground bg-muted/50">
                                <Package className="w-4 h-4 opacity-20" />
                            </div>
                        )}
                    </div>
                </td>
                <td className="p-4 font-medium">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsProductExpanded(!isProductExpanded)}
                            className={`p-1.5 rounded-md transition-all ${isProductExpanded ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-muted text-muted-foreground'}`}
                        >
                            {isProductExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                        <div>
                            <div className="line-clamp-1 max-w-[300px] text-sm font-semibold">{product.title || "İsimsiz Ürün"}</div>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono text-muted-foreground">
                                    ID: {product.ticimaxId}
                                </span>
                                <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                                    <Layers className="w-3 h-3" /> {Object.keys(colorGroups).length} Renk
                                </span>
                            </div>
                        </div>
                    </div>
                </td>
                <td className="p-4 text-xs text-muted-foreground align-middle">
                    <div className="bg-secondary/50 px-2 py-1 rounded-md border border-border/50 inline-block font-medium">
                        {product.categoryName || "-"}
                    </div>
                </td>
                <td className="p-4 text-xs text-muted-foreground align-middle">
                    <div className="font-medium">{product.brandName || "-"}</div>
                </td>
                <td className="p-4 font-mono font-bold text-sm text-foreground">
                    {product.price?.sale ? `${product.price.sale.toLocaleString('tr-TR')} ₺` : "0 ₺"}
                </td>
                <td className="p-4 text-center">
                    <div className="inline-flex flex-col items-center">
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                            {product._meta?.totalStock || 0}
                        </span>
                        <span className="text-[9px] uppercase tracking-tighter text-muted-foreground font-semibold">Toplam</span>
                    </div>
                </td>
                <td className="p-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                        ${product.status === 'published' ? 'bg-green-100 text-green-700 border border-green-200' :
                            product.status === 'draft' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-red-50 text-red-700'}`}>
                        {product.status || 'draft'}
                    </span>
                </td>
                <td className="p-4 text-right">
                    <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-primary/10 hover:text-primary">
                            <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive/60 hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                </td>
            </tr>

            {/* Expanded Product Content (Color Groups) */}
            {isProductExpanded && (
                <tr className="bg-muted/5">
                    <td colSpan={8} className="p-0 border-b">
                        <div className="p-4 pl-20 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                            <div className="flex items-center gap-2 mb-2 font-bold text-xs text-muted-foreground/80">
                                <Layers className="w-3.5 h-3.5 text-primary" />
                                RENK GRUPLARI
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                {Object.entries(colorGroups).map(([colorName, variants]) => {
                                    const isColorExpanded = expandedColors.includes(colorName);
                                    const colorImg = variants.find(v => v.images && v.images.length > 0)?.images?.[0];
                                    const totalColorStock = variants.reduce((sum, v) => sum + v.stock, 0);

                                    return (
                                        <div key={colorName} className="border rounded-xl bg-background shadow-sm overflow-hidden border-l-4 border-l-primary/30">
                                            {/* Color Header */}
                                            <div
                                                className="p-3 flex items-center justify-between cursor-pointer hover:bg-muted/20 transition-colors"
                                                onClick={() => toggleColor(colorName)}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="relative w-10 h-10 rounded-md overflow-hidden bg-muted border shadow-inner">
                                                        {colorImg ? (
                                                            <Image src={colorImg} alt={colorName} fill className="object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center bg-muted/30">
                                                                <Package className="w-4 h-4 opacity-10" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-sm flex items-center gap-2">
                                                            {colorName}
                                                            <span className="text-[10px] font-normal text-muted-foreground bg-muted px-1.5 rounded-full">
                                                                {variants.length} Beden
                                                            </span>
                                                        </div>
                                                        <div className="text-[10px] text-muted-foreground flex items-center gap-3 mt-0.5">
                                                            <span>Stok: <b className={totalColorStock > 0 ? "text-blue-600" : "text-red-500"}>{totalColorStock}</b></span>
                                                            <span>Barkodlar: {variants[0].barcode || "-"}...</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <Button size="sm" variant="ghost" className="h-8 gap-1 font-bold text-[10px] uppercase">
                                                    {isColorExpanded ? "Detayları Gizle" : "Bedenleri Gör"}
                                                    {isColorExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                                </Button>
                                            </div>

                                            {/* Color Body (Sizes) */}
                                            {isColorExpanded && (
                                                <div className="p-3 pt-0 border-t bg-muted/10 animate-in slide-in-from-top-2 duration-200">
                                                    <table className="w-full text-[11px] mt-2">
                                                        <thead className="text-muted-foreground uppercase tracking-widest font-black text-[9px] border-b">
                                                            <tr>
                                                                <th className="p-2 text-left">Beden Seçeneği</th>
                                                                <th className="p-2 text-left">SKU / Barkod</th>
                                                                <th className="p-2 text-right">Fiyat</th>
                                                                <th className="p-2 text-center">Stok</th>
                                                                <th className="p-2 text-center">Durum</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-border/40">
                                                            {variants.map(v => {
                                                                const sizeOpt = v.options.find(opt =>
                                                                    opt.type.toLowerCase() === "beden" || opt.type.toLowerCase() === "numara" || opt.type.toLowerCase() === "size"
                                                                );
                                                                return (
                                                                    <tr key={v.id} className="hover:bg-background/80">
                                                                        <td className="p-2">
                                                                            <span className="inline-flex items-center justify-center min-w-8 h-6 bg-primary/10 text-primary border border-primary/20 rounded font-bold">
                                                                                {sizeOpt?.value || "ST"}
                                                                            </span>
                                                                        </td>
                                                                        <td className="p-2">
                                                                            <code className="bg-muted px-1.5 py-0.5 rounded text-[10px]">{v.sku}</code>
                                                                            <div className="text-muted-foreground opacity-60 font-mono mt-0.5">{v.barcode}</div>
                                                                        </td>
                                                                        <td className="p-2 text-right font-mono font-bold">
                                                                            {v.price.toLocaleString('tr-TR')} ₺
                                                                        </td>
                                                                        <td className="p-2 text-center">
                                                                            <span className={`px-2 py-0.5 rounded-md font-mono font-black ${v.stock > 0 ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                                                                                {v.stock}
                                                                            </span>
                                                                        </td>
                                                                        <td className="p-2 text-center">
                                                                            <div className={`w-2 h-2 rounded-full mx-auto ${v.active ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-400 opacity-50'}`} />
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}
