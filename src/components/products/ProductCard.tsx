"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Edit, Trash2, ChevronDown, Package, Plus, X, UploadCloud, PlusCircle } from "lucide-react";
import { sanitizeTurkish } from "@/lib/utils";

interface Variant {
    size?: string;
    color?: string;
    qty?: number;
    stock?: number;
    quantity?: number;
    sku?: string;
    barcode?: string;
    image?: string;
    images?: string[];
    options?: { type?: string; value?: string }[];
    computedSize?: string;
    price?: number;
}

interface ProductCardProps {
    product: {
        id: string;
        title?: string;
        brandName?: string;
        categoryName?: string;
        hierarchicalCategoryName?: string;
        productTypeCategoryName?: string;
        images?: string[];
        price?: { sale?: number };
        variants?: Variant[];
        status?: string;
        productCode?: string;
        sku?: string;
        barcode?: string;
    };
}

export function ProductCard({ product }: ProductCardProps) {
    const router = useRouter();
    const [expanded, setExpanded] = useState(false);
    const [expandedColor, setExpandedColor] = useState<string | null>(null);

    // Modal states
    const [isAddVariantModalOpen, setIsAddVariantModalOpen] = useState(false);
    const [modalTab, setModalTab] = useState<"new-color" | "add-size">("new-color");
    
    // "Yeni Renk" tab states
    const [newVarColor, setNewVarColor] = useState("");
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
    
    // "Mevcut Renge Beden Ekle" tab states
    const [selectedExistingColor, setSelectedExistingColor] = useState("");
    
    // Shared: size rows (used by both tabs)
    const [sizeRows, setSizeRows] = useState([{ id: Date.now(), size: "", qty: "", price: "" }]);
    const [isSubmittingVariant, setIsSubmittingVariant] = useState(false);

    // Helpers
    const handleAddSizeRow = () => setSizeRows([...sizeRows, { id: Date.now(), size: "", qty: "", price: "" }]);
    const handleRemoveSizeRow = (id: number) => {
        if (sizeRows.length > 1) {
            setSizeRows(sizeRows.filter(r => r.id !== id));
        }
    };
    const updateSizeRow = (id: number, field: string, value: string) => {
        setSizeRows(sizeRows.map(r => r.id === id ? { ...r, [field]: value } : r));
    };

    const handleImageDrop = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);
            setSelectedImages(prev => [...prev, ...newFiles]);
            setImagePreviewUrls(prev => [...prev, ...newFiles.map(f => URL.createObjectURL(f))]);
        }
    };

    const removeImage = (index: number) => {
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
        setImagePreviewUrls(prev => prev.filter((_, i) => i !== index));
    };

    const resetModal = () => {
        setNewVarColor("");
        setSelectedExistingColor("");
        setSizeRows([{ id: Date.now(), size: "", qty: "", price: "" }]);
        setSelectedImages([]);
        setImagePreviewUrls([]);
        setModalTab("new-color");
    };

    const handleAddVariant = async () => {
        const validRows = sizeRows.filter(r => r.size.trim() !== "");
        if (validRows.length === 0) {
            alert("Lütfen en az bir beden girin.");
            return;
        }

        // Determine color based on active tab
        let rawColor = "";
        if (modalTab === "new-color") {
            rawColor = newVarColor.trim();
            if (!rawColor) {
                alert("Lütfen bir renk adı girin.");
                return;
            }
        } else {
            rawColor = selectedExistingColor;
            if (!rawColor) {
                alert("Lütfen mevcut bir renk seçin.");
                return;
            }
        }

        // Apply " - renk" suffix for new colors
        let finalizedColor = rawColor;
        if (modalTab === "new-color" && !finalizedColor.toLowerCase().endsWith('- renk')) {
            finalizedColor = `${finalizedColor} - renk`;
        }

        setIsSubmittingVariant(true);
        try {
            const uploadedImageUrls: string[] = [];

            // Only upload images for new color tab
            if (modalTab === "new-color" && selectedImages.length > 0) {
                const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(file);
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = error => reject(error);
                });

                for (const file of selectedImages) {
                    const base64Image = await toBase64(file);
                    const uploadRes = await fetch("/api/upload", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ image: base64Image, folder: "products" })
                    });
                    if (!uploadRes.ok) throw new Error("Fotoğraf yükleme başarısız oldu");
                    const uploadData = await uploadRes.json();
                    uploadedImageUrls.push(uploadData.url);
                }
            }

            const parentSku = product.productCode || product.sku || product.barcode || "";

            const payloadVariants = validRows.map(row => {
                const finalSize = row.size.trim();
                const barcode = `${sanitizeTurkish(parentSku)}-${sanitizeTurkish(finalizedColor)}-${sanitizeTurkish(finalSize)}`;
                
                // Resim belirleme: Yeni renk ise yüklenen resim, mevcut renk ise o rengin mevcut resimleri
                let variantImages: string[] = [];
                if (uploadedImageUrls.length > 0) {
                    variantImages = uploadedImageUrls;
                } else if (modalTab === "add-size" && selectedExistingColor) {
                    // Mevcut rengin varyantlarından resim bul
                    const existingColorVariants = colorGroups[selectedExistingColor] || [];
                    const existingImg = existingColorVariants.find((ev) => ev.image || ev.images?.[0]);
                    if (existingImg) {
                        variantImages = existingImg.images || (existingImg.image ? [existingImg.image] : []);
                    }
                }
                
                return {
                    color: finalizedColor,
                    size: finalSize,
                    qty: parseInt(row.qty) || 0,
                    price: parseFloat(row.price) || undefined,
                    barcode: barcode,
                    images: variantImages.length > 0 ? variantImages : undefined,
                    image: variantImages[0] || undefined
                };
            });

            const payload = {
                productId: product.id,
                variants: payloadVariants,
                galleryImages: uploadedImageUrls
            };

            const res = await fetch("/api/products/add-variant", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Varyant eklenirken hata oluştu -> " + (await res.text()));
            
            const result = await res.json();
            
            setIsAddVariantModalOpen(false);
            resetModal();
            router.refresh(); 

            // Show Ticimax sync result
            if (result.ticimax?.success) {
                alert(`✅ ${result.variantCount} varyant eklendi ve Ticimax'a BAŞARIYLA gönderildi! (Ticimax ID: ${result.ticimax.ticimaxId})`);
            } else {
                const rawInfo = result.ticimax?.rawResponse ? `\n\nTicimax Detay:\n${result.ticimax.rawResponse}` : "";
                alert(`⚠️ Varyantlar Firebase'e kaydedildi ANCAK Ticimax'a MÜDAHALE EDİLEMEDİ.\n\nSebep: ${result.ticimax?.error || "Bilinmeyen hata"}${rawInfo}`);
            }

        } catch (error) {
            alert(error instanceof Error ? error.message : "Bilinmeyen hata");
        } finally {
            setIsSubmittingVariant(false);
        }
    };
    const variants = product.variants || [];
    const hasVariants = variants.length > 0;

    // Group variants by color
    const colorGroups: Record<string, Variant[]> = {};
    variants.forEach((v) => {
        let color = v.color;
        let size = v.size;

        // Support for Ticimax-style options array
        if (v.options && Array.isArray(v.options)) {
            const colorOption = v.options.find((o) => o.type?.toLowerCase() === "renk" || o.type?.toLowerCase() === "color");
            const sizeOption = v.options.find((o) => o.type?.toLowerCase() === "beden" || o.type?.toLowerCase() === "size");
            if (colorOption) color = colorOption.value;
            if (sizeOption) size = sizeOption.value;
        }

        const finalColor = color || "Renksiz";
        v.computedSize = size || "Standart";

        if (!colorGroups[finalColor]) colorGroups[finalColor] = [];
        colorGroups[finalColor].push(v);
    });

    const existingColorNames = Object.keys(colorGroups);

    const catName = product.categoryName || product.hierarchicalCategoryName || product.productTypeCategoryName || "Kategori yok";

    return (
        <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden hover:border-amber-300 hover:shadow-xl transition-all duration-300 flex flex-col group relative">
            {/* Main Row */}
            <div className="flex flex-col sm:flex-row">
                {/* Image Container */}
                <div className="w-full sm:w-48 shrink-0 relative bg-stone-50 border-r border-stone-100 aspect-square sm:aspect-auto sm:min-h-[160px]">
                    <Link href={`/products/edit/${product.id}`} className="absolute inset-0 z-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={
                                product.images?.[0] ||
                                "https://via.placeholder.com/400x400?text=No+Image"
                            }
                            alt={product.title || "Ürün"}
                            className="product-image object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                        />
                    </Link>
                    
                    {/* Status Badge */}
                    {product.status && (
                        <div className={`absolute top-3 left-3 text-[10px] font-bold px-2 py-0.5 rounded-full pointer-events-none z-10 shadow-sm ${product.status === "published"
                                ? "bg-emerald-500 text-white"
                                : "bg-stone-500 text-white"
                            }`}>
                            {product.status === "published" ? "Yayında" : "Taslak"}
                        </div>
                    )}

                    {/* Hover overlay (Edit/Trash inside image area) */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 pointer-events-none z-20">
                        <Link 
                            href={`/products/edit/${product.id}`} 
                            className="pointer-events-auto w-10 h-10 rounded-full bg-white text-stone-700 hover:bg-amber-50 hover:text-amber-600 flex items-center justify-center transition-colors shadow-lg cursor-pointer transform hover:scale-110"
                        >
                            <Edit className="w-4 h-4" />
                        </Link>
                        <button className="w-10 h-10 rounded-full bg-white text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors shadow-lg cursor-pointer transform hover:scale-110 pointer-events-auto">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Info Container */}
                <div className="flex-1 p-5 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start gap-4">
                            <div>
                                <Link href={`/products/edit/${product.id}`}>
                                    <h3 className="font-bold text-lg text-stone-800 group-hover:text-amber-700 transition-colors cursor-pointer">
                                        {product.title || "İsimsiz Ürün"}
                                    </h3>
                                </Link>
                                <p className="text-sm text-stone-500 mt-1">
                                    {product.brandName || "Markasız"}
                                </p>
                            </div>
                            <div className="text-right">
                                <div className="text-xl font-extrabold text-stone-900 bg-amber-50 px-3 py-1 rounded-lg text-amber-900 border border-amber-100 inline-block">
                                    {product.price?.sale
                                        ? `${Number(product.price.sale).toLocaleString("tr-TR")} ₺`
                                        : "Fiyat Yok"}
                                </div>
                            </div>
                        </div>
                        <div className="mt-3">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-stone-100 text-stone-600 text-xs font-medium border border-stone-200">
                                <Package className="w-3.5 h-3.5" />
                                {catName}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between mt-4 border-t border-stone-100 pt-3">
                        <div className="flex items-center gap-2">
                             <div className="text-sm text-stone-600">
                                <span className="font-semibold text-stone-800">{variants.length}</span> varyant, <span className="font-semibold text-stone-800">{variants.reduce((s, v) => s + (v.qty ?? v.stock ?? v.quantity ?? 0), 0)}</span> adet stok
                             </div>
                             {Object.keys(colorGroups).length > 0 && (
                                <div className="flex items-center gap-1 ml-3 border-l border-stone-200 pl-3">
                                   {Object.keys(colorGroups).map((color, i) => (
                                     <div key={i} className="w-3 h-3 rounded-full border border-stone-300 shadow-sm" style={{ backgroundColor: getColorHex(color) }} title={color} />
                                   ))}
                                </div>
                             )}
                        </div>

                        <div className="flex gap-2">
                            {hasVariants && (
                                <button
                                    onClick={() => setExpanded(!expanded)}
                                    className={`flex items-center gap-1.5 text-sm font-medium transition-colors px-3 py-1.5 rounded-lg ${expanded ? "bg-amber-50 text-amber-700" : "bg-stone-50 text-stone-600 hover:bg-stone-100"}`}
                                >
                                    <span>Varyantları {expanded ? "Gizle" : "Göster"}</span>
                                    <ChevronDown
                                        className={`w-4 h-4 transition-transform duration-300 ${expanded ? "rotate-180" : ""
                                            }`}
                                    />
                                </button>
                            )}
                            <button
                                onClick={() => setIsAddVariantModalOpen(true)}
                                className="flex items-center gap-1.5 text-sm font-medium transition-colors px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100/50"
                            >
                                <Plus className="w-4 h-4" />
                                <span className={!hasVariants ? "inline-block" : "hidden sm:inline-block"}>Varyant Ekle</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Expandable Variants Panel (Nested Accordion) */}
            {expanded && hasVariants && (
                <div className="border-t border-stone-200 bg-stone-50/80 p-5 shrink-0">
                    <div className="flex flex-col gap-3">
                        {Object.entries(colorGroups).map(([color, items]) => {
                            const isColorExpanded = expandedColor === color;
                            const colorStock = items.reduce((s, v) => s + (v.qty ?? v.stock ?? v.quantity ?? 0), 0);
                            
                            // Attempt to get color image fallback chain
                            const firstImageVariant = items.find((v) => v.image || v.images?.[0]);
                            const colorImage = firstImageVariant?.image 
                                || firstImageVariant?.images?.[0] 
                                || product.images?.[0] 
                                || "https://via.placeholder.com/100x100?text=Renk";

                            return (
                                <div key={color} className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden transition-all duration-300">
                                    {/* Color Header */}
                                    <button
                                        onClick={() => setExpandedColor(isColorExpanded ? null : color)}
                                        className="w-full flex items-center justify-between p-3 hover:bg-stone-50 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={colorImage} className="w-12 h-12 rounded object-cover border border-stone-100" alt={color} />
                                            <div className="flex flex-col items-start gap-1">
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="w-4 h-4 rounded-full border border-stone-300 shadow-inner"
                                                        style={{ backgroundColor: getColorHex(color) }}
                                                    />
                                                    <span className="text-sm font-bold text-stone-700 capitalize">
                                                        {color}
                                                    </span>
                                                </div>
                                                <span className="text-xs text-stone-500 font-medium">{items.length} beden seçeneği</span>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-6">
                                            <div className="text-right flex flex-col items-end">
                                                <span className="text-sm font-semibold text-stone-700">{colorStock} adet</span>
                                                <span className="text-[10px] text-stone-400">toplam stok</span>
                                            </div>
                                            <ChevronDown
                                                className={`w-5 h-5 text-stone-400 transition-transform duration-300 ${isColorExpanded ? "rotate-180" : ""}`}
                                            />
                                        </div>
                                    </button>

                                    {/* Sizes Panel */}
                                    {isColorExpanded && (
                                        <div className="bg-stone-50/50 border-t border-stone-100 divide-y divide-stone-200/50">
                                            {items.map((v, i) => {
                                                const stock = v.qty ?? v.stock ?? v.quantity ?? 0;
                                                const inStock = stock > 0;
                                                const price = v.price || product.price?.sale || 0;
                                                const barcode = v.barcode || "Barkod Yok";

                                                return (
                                                    <div
                                                        key={i}
                                                        className={`flex items-center justify-between p-4 transition-colors ${
                                                            inStock ? "hover:bg-white" : "bg-stone-50/30 opacity-75"
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-6">
                                                            <div className={`w-16 text-center font-bold text-sm ${!inStock ? "text-stone-400 line-through" : "text-stone-800"}`}>
                                                                {v.computedSize}
                                                            </div>
                                                            <div className="flex flex-col gap-0.5 border-l border-stone-200 pl-6">
                                                                <span className="text-xs text-stone-500 font-mono tracking-wider">{barcode}</span>
                                                                <span className={`text-xs font-semibold ${inStock ? "text-emerald-600" : "text-red-500"}`}>
                                                                    {stock > 0 ? `${stock} Adet Stokta` : "Tükendi"}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        
                                                        {price > 0 ? (
                                                            <div className="text-sm font-extrabold text-stone-700 bg-white border border-stone-200 px-3 py-1.5 rounded-lg shadow-sm">
                                                                {Number(price).toLocaleString("tr-TR")} ₺
                                                            </div>
                                                        ) : (
                                                            <div className="text-xs font-medium text-stone-400 italic">Fiyat Yok</div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
            {/* Quick Add Variant Modal (Two-Tab) */}
            {isAddVariantModalOpen && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={(e) => { if (e.target === e.currentTarget) { setIsAddVariantModalOpen(false); resetModal(); } }}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative">
                        {/* Header */}
                        <div className="flex justify-between items-center p-5 border-b border-stone-100 bg-stone-50/50">
                            <h3 className="font-bold text-stone-800 text-lg">Varyant Ekle</h3>
                            <button onClick={() => { setIsAddVariantModalOpen(false); resetModal(); }} className="text-stone-400 hover:text-stone-600 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-stone-200">
                            <button
                                onClick={() => setModalTab("new-color")}
                                className={`flex-1 py-3 text-sm font-bold text-center transition-all border-b-2 ${
                                    modalTab === "new-color"
                                        ? "border-emerald-500 text-emerald-700 bg-emerald-50/50"
                                        : "border-transparent text-stone-400 hover:text-stone-600 hover:bg-stone-50"
                                }`}
                            >
                                🎨 Yeni Renk Ekle
                            </button>
                            <button
                                onClick={() => setModalTab("add-size")}
                                disabled={existingColorNames.length === 0}
                                className={`flex-1 py-3 text-sm font-bold text-center transition-all border-b-2 disabled:opacity-30 disabled:cursor-not-allowed ${
                                    modalTab === "add-size"
                                        ? "border-blue-500 text-blue-700 bg-blue-50/50"
                                        : "border-transparent text-stone-400 hover:text-stone-600 hover:bg-stone-50"
                                }`}
                            >
                                👟 Mevcut Renge Beden Ekle
                            </button>
                        </div>

                        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">

                            {/* === TAB 1: Yeni Renk Ekle === */}
                            {modalTab === "new-color" && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-12 gap-4">
                                        {/* Color Name Input */}
                                        <div className="col-span-12 sm:col-span-7 space-y-1.5">
                                            <label className="text-xs font-semibold text-stone-600 uppercase tracking-wider">Yeni Renk Adı</label>
                                            <input 
                                                type="text" 
                                                placeholder="Örn: Kırmızı, Lacivert, Bej..." 
                                                value={newVarColor} 
                                                onChange={e => setNewVarColor(e.target.value)} 
                                                className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm bg-stone-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all placeholder:text-stone-300"
                                            />
                                            <div className="text-[10px] text-stone-400 font-medium">
                                                Otomatik &quot; - renk&quot; eklenir. Barkod formatı: <strong className="text-blue-600">{sanitizeTurkish(product.productCode || product.sku || "SKU")}-RENK-BEDEN</strong>
                                            </div>
                                        </div>

                                        {/* Image Uploader */}
                                        <div className="col-span-12 sm:col-span-5 space-y-1.5">
                                            <label className="text-xs font-semibold text-stone-600 uppercase tracking-wider">Renk Görselleri</label>
                                            <div className="flex flex-wrap gap-1.5">
                                                {imagePreviewUrls.map((url, idx) => (
                                                    <div key={idx} className="relative w-[42px] h-[42px] rounded-lg overflow-hidden border border-stone-200 group/img">
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img src={url} className="w-full h-full object-cover" alt={`preview-${idx}`} />
                                                        <button
                                                            onClick={(e) => { e.preventDefault(); removeImage(idx); }}
                                                            className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity"
                                                        >
                                                            <X className="w-3.5 h-3.5 text-white" />
                                                        </button>
                                                    </div>
                                                ))}
                                                <label className="cursor-pointer w-[42px] h-[42px] border-2 border-dashed border-stone-200 hover:border-emerald-400 rounded-lg bg-stone-50 flex flex-col items-center justify-center transition-all">
                                                    <UploadCloud className="w-4 h-4 text-emerald-500" />
                                                    <span className="text-[8px] font-bold text-stone-400">Ekle</span>
                                                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageDrop} />
                                                </label>
                                            </div>
                                            {imagePreviewUrls.length > 0 && (
                                                <button onClick={() => { setSelectedImages([]); setImagePreviewUrls([]); }} className="text-[10px] text-red-500 hover:bg-red-50 w-full py-0.5 rounded font-bold transition-colors">Tümünü Kaldır</button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Existing Colors as reference */}
                                    {existingColorNames.length > 0 && (
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-[10px] text-stone-400 font-semibold">Mevcut renkler:</span>
                                            {existingColorNames.map(c => (
                                                <span key={c} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-stone-100 text-[10px] text-stone-500 font-medium border border-stone-200">
                                                    <span className="w-2 h-2 rounded-full border" style={{ backgroundColor: getColorHex(c) }}></span>
                                                    {c}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* === TAB 2: Mevcut Renge Beden Ekle === */}
                            {modalTab === "add-size" && (
                                <div className="space-y-3">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-stone-600 uppercase tracking-wider">Hangi Renge Beden Eklenecek?</label>
                                        <div className="grid grid-cols-1 gap-2">
                                            {existingColorNames.map(colorName => {
                                                const isSelected = selectedExistingColor === colorName;
                                                const colorImage = colorGroups[colorName]?.[0]?.image || colorGroups[colorName]?.[0]?.images?.[0] || product.images?.[0];
                                                const sizeCount = colorGroups[colorName]?.length || 0;
                                                return (
                                                    <button
                                                        key={colorName}
                                                        onClick={() => setSelectedExistingColor(colorName)}
                                                        className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                                                            isSelected
                                                                ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200 shadow-sm"
                                                                : "border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50"
                                                        }`}
                                                    >
                                                        {colorImage && (
                                                            /* eslint-disable-next-line @next/next/no-img-element */
                                                            <img src={colorImage} alt={colorName} className="w-10 h-10 rounded-lg object-cover border border-stone-100" />
                                                        )}
                                                        <div className="w-5 h-5 rounded-full border-2 border-stone-300 shadow-inner flex-shrink-0" style={{ backgroundColor: getColorHex(colorName) }}></div>
                                                        <div className="flex-1">
                                                            <div className="text-sm font-bold text-stone-700">{colorName}</div>
                                                            <div className="text-[10px] text-stone-400">{sizeCount} beden mevcut</div>
                                                        </div>
                                                        {isSelected && (
                                                            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                                                                <span className="text-white text-xs font-bold">✓</span>
                                                            </div>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <hr className="border-stone-100" />

                            {/* Shared: Dynamic Sizes Array */}
                            <div className="space-y-3">
                                <div className="flex items-end justify-between border-b border-stone-100 pb-2">
                                    <label className="text-xs font-semibold text-stone-600 uppercase tracking-wider flex items-center gap-2">
                                        {modalTab === "new-color" 
                                            ? `${newVarColor ? `"${newVarColor}" için` : ""} Bedenler & Stoklar`
                                            : `${selectedExistingColor ? `"${selectedExistingColor}" için` : ""} Yeni Bedenler & Stoklar`
                                        }
                                    </label>
                                    <button onClick={handleAddSizeRow} className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-lg transition-colors">
                                        <PlusCircle className="w-3.5 h-3.5" /> Satır Ekle
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    <div className="grid grid-cols-12 gap-2 px-1 text-[10px] font-extrabold text-stone-400">
                                        <div className="col-span-4 uppercase">Beden</div>
                                        <div className="col-span-3 uppercase">Stok</div>
                                        <div className="col-span-4 uppercase">Fiyat (Ops.)</div>
                                        <div className="col-span-1"></div>
                                    </div>

                                    {sizeRows.map((row) => (
                                        <div key={row.id} className="grid grid-cols-12 gap-2 items-center bg-stone-50 p-1.5 rounded-xl border border-stone-100/50">
                                            <div className="col-span-4">
                                                <input 
                                                    placeholder="Örn: 38" 
                                                    value={row.size} 
                                                    onChange={e => updateSizeRow(row.id, 'size', e.target.value)} 
                                                    className="w-full text-center font-bold px-2 py-1.5 border border-stone-200 focus:border-emerald-500 rounded-lg text-sm bg-white outline-none transition-colors" 
                                                />
                                            </div>
                                            <div className="col-span-3">
                                                <input 
                                                    type="number" placeholder="0" min="0"
                                                    value={row.qty} 
                                                    onChange={e => updateSizeRow(row.id, 'qty', e.target.value)} 
                                                    className="w-full text-center px-2 py-1.5 border border-stone-200 focus:border-emerald-500 rounded-lg text-sm bg-white outline-none transition-colors" 
                                                />
                                            </div>
                                            <div className="col-span-4">
                                                <input 
                                                    type="number" placeholder="-" 
                                                    value={row.price} 
                                                    onChange={e => updateSizeRow(row.id, 'price', e.target.value)} 
                                                    className="w-full text-center px-2 py-1.5 border border-stone-200 focus:border-emerald-500 rounded-lg text-sm bg-white outline-none transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                                                />
                                            </div>
                                            <div className="col-span-1 flex justify-center">
                                                <button 
                                                    disabled={sizeRows.length === 1} 
                                                    onClick={() => handleRemoveSizeRow(row.id)} 
                                                    className="p-1 rounded-md text-red-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-5 border-t border-stone-100 bg-stone-50/50 flex justify-between items-center rounded-b-2xl">
                            <div className="text-[10px] text-stone-400 max-w-[180px]">
                                {sizeRows.filter(r => r.size.trim()).length} beden eklenecek
                                {modalTab === "new-color" && newVarColor && <> · <strong>{newVarColor}</strong> rengi</>}
                                {modalTab === "add-size" && selectedExistingColor && <> · <strong>{selectedExistingColor}</strong> rengine</>}
                            </div>
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => { setIsAddVariantModalOpen(false); resetModal(); }}
                                    className="px-4 py-2 text-stone-600 font-medium hover:bg-stone-200 rounded-lg transition-colors text-sm"
                                >
                                    İptal
                                </button>
                                <button 
                                    onClick={handleAddVariant}
                                    disabled={isSubmittingVariant || sizeRows.every(r => r.size.trim() === "") || (modalTab === "new-color" && !newVarColor.trim()) || (modalTab === "add-size" && !selectedExistingColor)}
                                    className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-md hover:shadow-lg text-white font-bold rounded-lg transition-all text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmittingVariant ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                                            <span>Yükleniyor...</span>
                                        </>
                                    ) : (
                                        modalTab === "new-color" ? "Renk & Bedenleri Kaydet" : "Bedenleri Ekle"
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>, 
                document.body
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
