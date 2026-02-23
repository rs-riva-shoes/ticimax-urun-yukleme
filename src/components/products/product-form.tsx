"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Wand2, Eye } from "lucide-react";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Sub-components
import { ImageUpload } from "./form-sections/ImageUpload";
import { ProductInfo } from "./form-sections/ProductInfo";
import { PricingInfo } from "./form-sections/PricingInfo";
import { CategorySelector } from "./form-sections/CategorySelector";
import { VariantManager } from "./form-sections/VariantManager";
import { ReviewModal } from "./form-sections/ReviewModal";
import { ShippingInfo } from "./form-sections/ShippingInfo";

// Data
import productTypeCategories from "@/data/product-type-categories.json";

interface AttributeValue {
    valueId: number;
    name: string;
}

interface Attribute {
    featureId: number;
    name: string;
    groupId?: number;
    values: AttributeValue[];
}

interface ProductFormProps {
    attributes: Attribute[];
    brands: any[];
    suppliers: any[];
}

export function ProductForm({ attributes, brands: initialBrands, suppliers: initialSuppliers }: ProductFormProps) {
    // Files & Basic Info
    const [files, setFiles] = useState<File[]>([]);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [productCode, setProductCode] = useState(""); // Model Kodu / Stok Kodu

    // AI States
    const [aiLoading, setAiLoading] = useState(false);
    const [nameSuggesting, setNameSuggesting] = useState(false);

    // Categories & Brand

    // Dual Category System
    const [hierarchicalCategoryIds, setHierarchicalCategoryIds] = useState<string[]>([]);
    const [hierarchicalCategoryName, setHierarchicalCategoryName] = useState("");

    const [productTypeCategoryId, setProductTypeCategoryId] = useState("");
    const [productTypeCategoryName, setProductTypeCategoryName] = useState("");

    const [selectedBrand, setSelectedBrand] = useState("");
    const [selectedBrandName, setSelectedBrandName] = useState("");
    const [brands, setBrands] = useState<any[]>(initialBrands); // Markalar listesi

    // Suppliers
    const [suppliers, setSuppliers] = useState<any[]>(initialSuppliers);
    const [selectedSupplier, setSelectedSupplier] = useState("1"); // Varsayılan: 1

    // Pricing
    const [purchasePrice, setPurchasePrice] = useState("");
    const [salePrice, setSalePrice] = useState("");
    const [discountPrice, setDiscountPrice] = useState("");
    const [taxRate, setTaxRate] = useState("10"); // Default 10% KDV

    // Dimensions
    const [dimensions, setDimensions] = useState({
        width: "",
        height: "",
        depth: "",
        weight: ""
    });

    // Variants & Color Settings
    interface Variant {
        size: string;
        color: string;
        qty: number;
        sku?: string;
        barcode?: string;
    }
    const [variants, setVariants] = useState<Variant[]>([]);

    // Color Settings (Image Mapping & Custom Titles)
    interface ColorSetting {
        imageIndices: number[];
        title: string;
    }
    const [colorSettings, setColorSettings] = useState<Record<string, ColorSetting>>({});

    // Attributes
    const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});

    // System States
    const [showReview, setShowReview] = useState(false);
    const [pushStatus, setPushStatus] = useState<"idle" | "pushing" | "success" | "error">("idle");
    const [isSaving, setIsSaving] = useState(false);
    const [savedProductId, setSavedProductId] = useState<string | null>(null);

    // Initial Data Fetch removed - using static data passed from page


    // Add New Supplier Handler
    const handleAddSupplier = async (name: string, _ignoredId: string) => {
        try {
            const res = await fetch("/api/settings/suppliers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name }) // Sadece isim gönderiyoruz
            });
            const data = await res.json();
            if (data.success && data.supplier) {
                setSuppliers(prev => [...prev, data.supplier]);
                if (data.supplier.ticimaxId) {
                    setSelectedSupplier(data.supplier.ticimaxId.toString());
                }
                alert(`Tedarikçi eklendi! ID: ${data.supplier.ticimaxId || "?"}`);
            } else {
                alert("Hata: " + (data.error || "Bilinmeyen hata"));
            }
        } catch (e) {
            console.error("Supplier add error:", e);
            alert("Bağlantı hatası");
        }
    };

    // Add New Brand Handler
    const handleAddBrand = async (name: string) => {
        try {
            const res = await fetch("/api/settings/brands", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name })
            });
            const data = await res.json();
            if (data.success && data.brand) {
                setBrands(prev => [...prev, data.brand]);
                if (data.brand.ticimaxId) {
                    setSelectedBrand(data.brand.ticimaxId.toString());
                }
                alert(`Marka eklendi! ID: ${data.brand.ticimaxId}`);
            } else {
                alert("Hata: " + (data.error || "Bilinmeyen hata"));
            }
        } catch (e) {
            console.error("Brand add error:", e);
            alert("Bağlantı hatası");
        }
    };

    // AI Name Suggestion
    useEffect(() => {
        const suggestName = async () => {
            if (files.length === 0 || title !== "") return;

            setNameSuggesting(true);
            try {
                const imagePromises = files.slice(0, 2).map(file => {
                    return new Promise<string>((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result as string);
                        reader.readAsDataURL(file);
                    });
                });

                const base64Images = await Promise.all(imagePromises);

                const response = await fetch("/api/ai/suggest-name", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ images: base64Images })
                });

                const data = await response.json();

                if (data.success && data.suggestedName) {
                    setTitle(data.suggestedName);
                    if (data.productType) {
                        const foundType = productTypeCategories.find(c => c.name.toLowerCase().includes(data.productType.toLowerCase()));
                        if (foundType) {
                            setProductTypeCategoryId(foundType.id);
                            setProductTypeCategoryName(foundType.name);
                        }
                    }
                }
            } catch (error) {
                console.error("Name suggestion error:", error);
            } finally {
                setNameSuggesting(false);
            }
        };

        suggestName();
    }, [files, title]);

    // AI Fill Handler
    const handleAiFill = async () => {
        if (!title && files.length === 0) {
            alert("Önce bir ürün adı girin veya fotoğraf yükleyin!");
            return;
        }

        setAiLoading(true);
        try {
            if (files.length > 0) {
                const imagePromises = files.slice(0, 3).map(file => {
                    return new Promise<string>((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result as string);
                        reader.readAsDataURL(file);
                    });
                });

                const base64Images = await Promise.all(imagePromises);

                const response = await fetch("/api/ai/analyze-product", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        title,
                        images: base64Images,
                        categories: productTypeCategories,
                        attributes
                    })
                });

                const data = await response.json();

                if (data.success) {
                    setDescription(data.descriptionHtml || `<p><strong>${title}</strong></p>`);

                    if (data.hierarchicalCategoryIds) {
                        setHierarchicalCategoryIds(data.hierarchicalCategoryIds);
                        setHierarchicalCategoryName(data.hierarchicalCategoryName || "");
                    }
                    if (data.productTypeCategoryId) {
                        setProductTypeCategoryId(data.productTypeCategoryId);
                        setProductTypeCategoryName(data.productTypeCategoryName || "");
                    }

                    if (data.attributeSelections) {
                        // Ensure all values are strings for select inputs
                        const formattedSelections: Record<string, string> = {};
                        Object.entries(data.attributeSelections).forEach(([key, val]) => {
                            formattedSelections[key] = String(val);
                        });
                        setSelectedAttributes(formattedSelections);
                    }
                } else {
                    throw new Error(data.error || "AI analysis failed");
                }
            } else {
                const response = await fetch("/api/ai/predict-category", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ title, categories: productTypeCategories })
                });

                const data = await response.json();

                if (data.success) {
                    setDescription(`<p><strong>${title}</strong> - ${data.reason}</p>`);

                    if (data.categoryId) {
                        const foundType = productTypeCategories.find(c => c.id === data.categoryId);
                        if (foundType) {
                            setProductTypeCategoryId(foundType.id);
                            setProductTypeCategoryName(foundType.name);
                        }
                    }
                }
            }
        } catch (e) {
            console.error("AI Fill Error:", e);
            alert("AI analizi başarısız oldu.");
        } finally {
            setAiLoading(false);
        }
    };

    // Helper to upload images using server-side API proxy to bypass CORS
    const uploadImages = async (): Promise<string[]> => {
        if (files.length === 0) {
            console.log("Yüklenecek resim yok.");
            return [];
        }

        console.log(`[Client] ${files.length} resim Sunucu API üzerinden yükleniyor...`);

        const uploadPromises = files.map(async (file, index) => {
            console.log(`[Client] Resim ${index + 1}/${files.length} hazırlanıyor: ${file.name}`);

            // Convert to base64
            const base64 = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(file);
            });

            try {
                const res = await fetch("/api/upload", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ image: base64 })
                });

                if (!res.ok) {
                    const errDetail = await res.text();
                    throw new Error(`Upload failed: ${res.statusText} - ${errDetail}`);
                }

                const data = await res.json();
                if (!data.success) {
                    throw new Error(data.error || "Unknown upload error");
                }

                console.log(`[Client] Resim ${index + 1} tamamlandı: ${data.url}`);
                return { index, url: data.url };
            } catch (err) {
                console.error(`[Client] Resim ${index + 1} yükleme hatası:`, err);
                throw err;
            }
        });

        const results = await Promise.all(uploadPromises);
        console.log("[Client] Tüm resimler yüklendi.");
        return results.sort((a, b) => a.index - b.index).map(r => r.url);
    };

    const preparePayload = (imageUrls?: string[]) => {
        const categoryId = productTypeCategoryId;
        const categoryName = productTypeCategoryName;

        return {
            title,
            description,
            productCode, // Model Kodu
            categoryId,
            categoryName,
            brandId: selectedBrand,
            brandName: selectedBrandName,
            supplierId: selectedSupplier, // Add supplier ID to payload
            hierarchicalCategoryIds,
            hierarchicalCategoryName,
            productTypeCategoryId,
            productTypeCategoryName,
            combinedCategoryIds: [
                ...hierarchicalCategoryIds,
                productTypeCategoryId
            ].filter(Boolean), // Remove empty strings
            colorSettings, // Save mapping to Firebase
            price: {
                purchase: parseFloat(purchasePrice) || 0,
                sale: parseFloat(salePrice) || 0,
                discount: parseFloat(discountPrice) || 0,
                tax: parseFloat(taxRate) || 10,
                currency: "TRY"
            },
            dimensions: {
                width: parseFloat(dimensions.width) || 0,
                height: parseFloat(dimensions.height) || 0,
                depth: parseFloat(dimensions.depth) || 0,
                weight: parseFloat(dimensions.weight) || 0
            },
            variants: variants.map(v => {
                // Enrich variant with specific image URL and Title if available
                // Robust lookup to handle case/whitespace differences
                const normalize = (s: string) => s?.trim().toLowerCase() || "";
                const matchedColorKey = Object.keys(colorSettings).find(
                    key => normalize(key) === normalize(v.color)
                );
                const setting = matchedColorKey ? colorSettings[matchedColorKey] : undefined;

                let variantImages: string[] = [];

                // Collect ALL selected images for the variant
                if (imageUrls && setting?.imageIndices && setting.imageIndices.length > 0) {
                    variantImages = setting.imageIndices.map(index => imageUrls[index]).filter(Boolean);
                }

                return {
                    ...v,
                    qty: Number(v.qty),
                    image: variantImages[0] || "", // Keep for backward compatibility/preview
                    images: variantImages, // Send all images
                    customTitle: setting?.title || "", // Add custom title
                    _debugIndices: setting?.imageIndices || [] // Debug info to trace selection
                };
            }),
            selectedAttributes: Object.entries(selectedAttributes).map(([k, v]) => {
                const attr = attributes.find(a => a.featureId.toString() === k);
                const attrName = attr?.name;

                let finalValueId = v;

                // Eğer v sayısal değilse (örn: "Tekstil"), ID'sini bulmaya çalış
                if (isNaN(Number(v))) {
                    const foundVal = attr?.values.find(av => av.name.toLowerCase() === String(v).toLowerCase());
                    if (foundVal) {
                        finalValueId = foundVal.valueId.toString();
                    } else {
                        console.warn(`[Payload] Özellik değeri ID'ye çevrilemedi ve listede bulunamadı: ${attrName} -> ${v}`);
                        // Eğer bulunamazsa, bu değeri göndermeyelim (filter ile temizleyeceğiz)
                        finalValueId = "INVALID";
                    }
                }

                const valName = attr?.values.find((val) => val.valueId.toString() === finalValueId)?.name;
                return { featureId: k, valueId: finalValueId, name: attrName, valueName: valName, groupId: attr?.groupId || 0 };
            }).filter(item => item.valueId !== "INVALID"),
            _meta: {
                imageCount: files.length,
                totalStock: variants.reduce((acc, curr) => acc + curr.qty, 0)
            }
        };
    };

    const handleSaveDraft = async () => {
        if (!title) {
            alert("Lütfen en azından bir ürün adı girin.");
            return;
        }

        setIsSaving(true);
        try {
            // 1. Upload Images
            const imageUrls = await uploadImages();

            // 2. Prepare Payload (Enriched with Image URLs)
            const payload = preparePayload(imageUrls);

            const productData = {
                ...payload,
                id: savedProductId,
                images: imageUrls, // Main image list
                status: "draft",
                updatedAt: new Date().toISOString(),
            };

            if (!savedProductId) {
                // @ts-expect-error - Adding field dynamically
                productData.createdAt = new Date().toISOString();
            }

            const response = await fetch("/api/products/save", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(productData),
            });

            const data = await response.json();

            if (data.success) {
                setSavedProductId(data.productId);
                alert("✅ Ürün başarıyla taslak olarak kaydedildi!");
            } else {
                throw new Error(data.error || "Kaydetme başarısız");
            }

        } catch (error) {
            console.error("Save error:", error);
            alert("Kaydederken bir hata oluştu: " + (error as Error).message);
        } finally {
            setIsSaving(false);
        }
    };

    const handlePush = async () => {
        console.log("[Client] 'Ticimax'a Gönder' tetiklendi.");
        setPushStatus("pushing");
        try {
            // 1. Upload Images First (Crucial fix!)
            console.log("[Client] Resim yükleme işlemi başlıyor...");
            const imageUrls = await uploadImages();
            console.log("[Client] Resim yükleme bitti. Payload hazırlanıyor...");

            // 2. Prepare Payload
            const payload = preparePayload(imageUrls);
            console.log("[Client] Payload hazır. API isteği atılıyor...");

            // 60-second timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000);

            try {
                const res = await fetch("/api/ticimax/push", {
                    method: "POST",
                    body: JSON.stringify({
                        productId: savedProductId || "NEW",
                        ...payload,
                        images: imageUrls
                    }),
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                const data = await res.json();

                if (data.success) {
                    setPushStatus("success");

                    // Firebase'e "Yayınlandı" (published) olarak kaydet
                    try {
                        const productData = {
                            ...payload,
                            id: savedProductId,
                            images: imageUrls,
                            status: "published",
                            ticimaxId: data.ticimaxId,
                            updatedAt: new Date().toISOString(),
                            ...(!savedProductId ? { createdAt: new Date().toISOString() } : {})
                        };

                        const dbResp = await fetch("/api/products/save", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(productData),
                        });

                        const dbData = await dbResp.json();
                        if (dbData.success) {
                            setSavedProductId(dbData.productId);
                        }
                    } catch (dbErr) {
                        console.error("Firebase update error after push:", dbErr);
                    }

                    alert(`✅ Başarılı! Ticimax ID: ${data.ticimaxId}`);
                } else {
                    setPushStatus("error");
                    alert(`❌ Hata: ${data.error}\nDetay: ${data.details || ""}`);
                }
            } catch (fetchError: unknown) {
                clearTimeout(timeoutId);
                if ((fetchError as Error).name === 'AbortError') {
                    throw new Error("İstek zaman aşımına uğradı (60 sn). İnternet bağlantınızı kontrol edin veya Ticimax sunucusu yanıt vermiyor.");
                }
                throw fetchError;
            }
        } catch (e) {
            setPushStatus("error");
            console.error("Push error:", e);
            alert(`Hata oluştu: ${(e as Error).message}`);
        }
    };

    return (
        <>
            <ReviewModal
                showReview={showReview}
                setShowReview={setShowReview}
                payload={preparePayload()}
                handlePush={handlePush}
                pushStatus={pushStatus}
            />

            {/* ─── Sticky Header Bar ─── */}
            <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-stone-200/60">
                <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white font-bold text-xs shadow-md">
                            +
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-stone-900 leading-tight">Yeni Ürün</h1>
                            <p className="text-xs text-stone-400">Bilgileri doldurun, sonra gönderin</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSaveDraft}
                            disabled={isSaving || pushStatus === "pushing"}
                            className="border-stone-300 hover:bg-stone-50 text-xs h-8"
                        >
                            {isSaving ? (
                                <>
                                    <Wand2 className="w-3 h-3 animate-spin mr-1.5" />
                                    Kaydediliyor...
                                </>
                            ) : (
                                "Taslak Kaydet"
                            )}
                        </Button>
                        <button
                            className="btn-arslan flex items-center gap-1.5 text-xs !py-1.5 !px-4"
                            onClick={() => setShowReview(true)}
                        >
                            <Eye className="w-3.5 h-3.5" />
                            İncele & Gönder
                        </button>
                    </div>
                </div>
            </div>

            {/* ─── Main Content ─── */}
            <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">

                {/* ① Fotoğraflar */}
                <section>
                    <div className="flex items-center gap-2.5 mb-3">
                        <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center">1</span>
                        <h2 className="text-sm font-bold text-stone-700 uppercase tracking-wide">Fotoğraflar</h2>
                    </div>
                    <div className="stat-card !p-0 overflow-hidden">
                        <ImageUpload files={files} setFiles={setFiles} />
                    </div>
                </section>

                {/* ② Ürün Bilgileri + Kategori */}
                <section>
                    <div className="flex items-center gap-2.5 mb-3">
                        <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center">2</span>
                        <h2 className="text-sm font-bold text-stone-700 uppercase tracking-wide">Ürün Bilgileri</h2>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                        {/* Sol: Ürün adı, açıklama, stok kodu */}
                        <div className="lg:col-span-2 stat-card !p-5">
                            <ProductInfo
                                title={title}
                                setTitle={setTitle}
                                description={description}
                                setDescription={setDescription}
                                productCode={productCode}
                                setProductCode={setProductCode}
                                brandName={selectedBrandName}
                                categoryName={productTypeCategoryName}
                                gender={hierarchicalCategoryName}
                                handleAiFill={handleAiFill}
                                aiLoading={aiLoading}
                                nameSuggesting={nameSuggesting}
                                hasFiles={files.length > 0}
                            />
                        </div>
                        {/* Sağ: Kategori & Marka */}
                        <div className="stat-card !p-5">
                            <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wide mb-3">Sınıflandırma</h3>
                            <CategorySelector
                                hierarchicalCategoryName={hierarchicalCategoryName}
                                setHierarchicalCategoryName={setHierarchicalCategoryName}
                                setHierarchicalCategoryIds={setHierarchicalCategoryIds}
                                hierarchicalCategoryIds={hierarchicalCategoryIds}
                                productTypeCategoryId={productTypeCategoryId}
                                setProductTypeCategoryId={setProductTypeCategoryId}
                                setProductTypeCategoryName={setProductTypeCategoryName}
                                selectedBrand={selectedBrand}
                                setSelectedBrand={setSelectedBrand}
                                setSelectedBrandName={setSelectedBrandName}
                                brands={brands}
                                onAddBrand={handleAddBrand}
                                suppliers={suppliers}
                                selectedSupplier={selectedSupplier}
                                setSelectedSupplier={setSelectedSupplier}
                                onAddSupplier={handleAddSupplier}
                            />
                        </div>
                    </div>
                </section>

                {/* ③ Fiyat & Kargo */}
                <section>
                    <div className="flex items-center gap-2.5 mb-3">
                        <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center">3</span>
                        <h2 className="text-sm font-bold text-stone-700 uppercase tracking-wide">Fiyat & Kargo</h2>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        <div className="stat-card !p-5">
                            <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wide mb-3">Fiyatlandırma</h3>
                            <PricingInfo
                                purchasePrice={purchasePrice}
                                setPurchasePrice={setPurchasePrice}
                                salePrice={salePrice}
                                setSalePrice={setSalePrice}
                                discountPrice={discountPrice}
                                setDiscountPrice={setDiscountPrice}
                                taxRate={taxRate}
                                setTaxRate={setTaxRate}
                            />
                        </div>
                        <div className="stat-card !p-5">
                            <ShippingInfo dimensions={dimensions} setDimensions={setDimensions} />
                        </div>
                    </div>
                </section>

                {/* ④ Asorti / Varyantlar */}
                <section>
                    <div className="flex items-center gap-2.5 mb-3">
                        <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center">4</span>
                        <h2 className="text-sm font-bold text-stone-700 uppercase tracking-wide">Asorti & Varyantlar</h2>
                    </div>
                    <VariantManager
                        variants={variants}
                        setVariants={setVariants}
                        productCode={productCode}
                        selectedCategoryId={productTypeCategoryId}
                        categoryName={productTypeCategoryName}
                        files={files}
                        colorSettings={colorSettings}
                        setColorSettings={setColorSettings}
                        productTitle={title}
                    />
                </section>

                {/* ⑤ Teknik Özellikler */}
                {attributes.length > 0 && (
                    <section>
                        <div className="flex items-center gap-2.5 mb-3">
                            <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center">5</span>
                            <h2 className="text-sm font-bold text-stone-700 uppercase tracking-wide">Teknik Özellikler</h2>
                            <span className="text-[10px] text-stone-400 ml-1">{attributes.length} özellik</span>
                        </div>
                        <div className="stat-card !p-5">
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-3">
                                {attributes.map(attr => (
                                    <div key={attr.featureId} className="flex flex-col gap-1">
                                        <label className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">{attr.name}</label>
                                        <select
                                            className="w-full text-sm py-1.5 px-2 rounded-lg border border-stone-200 bg-stone-50/50 hover:border-amber-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-colors outline-none"
                                            value={selectedAttributes[attr.featureId] || ""}
                                            onChange={(e) => setSelectedAttributes(prev => ({ ...prev, [attr.featureId]: e.target.value }))}
                                        >
                                            <option value="">—</option>
                                            {attr.values.map(val => (
                                                <option key={val.valueId} value={val.valueId}>{val.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* Spacer */}
                <div className="h-4" />
            </div>

            <ReviewModal
                showReview={showReview}
                setShowReview={setShowReview}
                payload={preparePayload()}
                files={files}
                handlePush={handlePush}
                pushStatus={pushStatus}
            />
        </>
    );
}

