import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Wand2, Sparkles, Image as ImageIcon } from "lucide-react";

interface Variant {
    size: string;
    color: string;
    qty: number;
    sku?: string;
    barcode?: string;
}

export interface ColorSetting {
    imageIndices: number[]; // Array of selected image indices
    title: string;
}

interface VariantManagerProps {
    variants: Variant[];
    setVariants: (variants: Variant[]) => void;
    productCode: string;
    selectedCategoryId: string;
    categoryName: string;
    files: File[];
    colorSettings: Record<string, ColorSetting>;
    setColorSettings: (settings: Record<string, ColorSetting>) => void;
    productTitle: string; // New prop for auto-title generation
}

export function VariantManager({
    variants,
    setVariants,
    productCode,
    selectedCategoryId,
    categoryName,
    files,
    colorSettings,
    setColorSettings,
    productTitle
}: VariantManagerProps) {
    const [isGeneratingBulkSKU, setIsGeneratingBulkSKU] = useState(false);
    const [isDoubleSize, setIsDoubleSize] = useState(false); // Çift numara (36-37) modu

    // Bulk variant generation state
    const [bulkSizeStart, setBulkSizeStart] = useState("");
    const [bulkSizeEnd, setBulkSizeEnd] = useState("");
    const [bulkColors, setBulkColors] = useState("");

    // Identify unique colors
    const uniqueColors = useMemo(() => {
        const colors = new Set(variants.map(v => v.color).filter(c => c));
        return Array.from(colors);
    }, [variants]);

    // Initialize/Update settings for new colors and sync titles
    useEffect(() => {
        const newSettings = { ...colorSettings };
        let hasChanges = false;

        uniqueColors.forEach(color => {
            // Define expected title format
            const cleanTitle = productTitle || categoryName || "Ürün";
            const expectedTitle = `${cleanTitle} - ${color}`;

            if (!newSettings[color]) {
                // Initialize new color setting
                newSettings[color] = {
                    imageIndices: [],
                    title: expectedTitle
                };
                hasChanges = true;
            } else if (productTitle && newSettings[color].title !== expectedTitle) {
                // Update title if product title changed (and user hasn't completely overridden it? 
                // For now, let's keep it responsive to the main title as requested)
                // NOTE: This might overwrite manual edits if main title changes.
                newSettings[color].title = expectedTitle;
                hasChanges = true;
            }
        });

        if (hasChanges) {
            setColorSettings(newSettings);
        }
    }, [uniqueColors, categoryName, productTitle]); // Added productTitle dependency

    const updateColorSetting = (color: string, field: keyof ColorSetting, value: any) => {
        setColorSettings({
            ...colorSettings,
            [color]: {
                ...colorSettings[color],
                [field]: value
            }
        });
    };

    const toggleImageSelection = (color: string, index: number) => {
        const currentIndices = colorSettings[color]?.imageIndices || [];
        const newIndices = currentIndices.includes(index)
            ? currentIndices.filter(i => i !== index)
            : [...currentIndices, index];

        updateColorSetting(color, "imageIndices", newIndices.sort((a, b) => a - b));
    };

    // ... (existing helper functions like generateBarcode)

    const generateBarcode = (code: string, color: string, size: string) => {
        if (!code || !color || !size) return "";
        const cleanText = (text: string) => text.toUpperCase()
            .replace(/İ/g, "I").replace(/Ğ/g, "G").replace(/Ü/g, "U").replace(/Ş/g, "S").replace(/Ö/g, "O").replace(/Ç/g, "C")
            .replace(/[^A-Z0-9-]/g, "");

        return `${cleanText(code)}-${cleanText(color)}-${cleanText(size)}`;
    };

    // ... (existing actions: addVariant, removeVariant, updateVariant, generateBulkVariants)

    const addVariant = () => {
        setVariants([...variants, { size: "", color: "", qty: 1, sku: productCode }]);
    };

    const removeVariant = (index: number) => setVariants(variants.filter((_, i) => i !== index));

    const updateVariant = (index: number, field: keyof Variant, value: string | number) => {
        const newVariants = [...variants];

        if (field === "qty") {
            newVariants[index].qty = Number(value);
        } else {
            // @ts-ignore
            newVariants[index][field] = String(value);
        }

        if (field === "size" || field === "color") {
            const currentSize = field === "size" ? String(value) : newVariants[index].size;
            const currentColor = field === "color" ? String(value) : newVariants[index].color;

            if (productCode && currentSize && currentColor) {
                newVariants[index].barcode = generateBarcode(productCode, currentColor, currentSize);
            }
        }

        newVariants[index].sku = productCode;
        setVariants(newVariants);
    };

    useEffect(() => {
        if (variants.length > 0 && productCode) {
            const updatedVariants = variants.map(v => ({
                ...v,
                sku: productCode,
                barcode: generateBarcode(productCode, v.color, v.size)
            }));
            if (JSON.stringify(updatedVariants) !== JSON.stringify(variants)) {
                setVariants(updatedVariants);
            }
        }
    }, [productCode]);

    const generateBulkVariants = () => {
        if (!bulkSizeStart || !bulkSizeEnd || !bulkColors) {
            alert("Tüm alanları doldurun!");
            return;
        }

        if (!productCode) {
            alert("Önce 'Genel Bilgiler' kısmından bir Model Kodu girin!");
            return;
        }

        const start = parseInt(bulkSizeStart);
        const end = parseInt(bulkSizeEnd);

        if (isNaN(start) || isNaN(end) || start > end) {
            alert("Geçerli bir beden aralığı girin!");
            return;
        }

        const colorList = bulkColors.split(',').map(c => c.trim()).filter(c => c);

        if (colorList.length === 0) {
            alert("En az bir renk girin!");
            return;
        }

        const newVariants: Variant[] = [];

        for (const color of colorList) {
            // Çift numara mantığı: 36-37, 38-39 gibi ikişer atlayarak gider
            const step = isDoubleSize ? 2 : 1;

            for (let size = start; size <= end; size += step) {
                // Çift numaraysa format "36-37", değilse "36"
                const sizeStr = isDoubleSize ? `${size}-${size + 1}` : size.toString();

                newVariants.push({
                    size: sizeStr,
                    color: color,
                    qty: 10, // Default qty
                    sku: productCode,
                    barcode: generateBarcode(productCode, color, sizeStr)
                });
            }
        }

        setVariants([...variants, ...newVariants]);
        setBulkSizeStart("");
        setBulkSizeEnd("");
        setBulkColors("");
    };

    return (
        <Card className="shadow-md border-muted">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Asorti / Varyantlar</CardTitle>
                <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={addVariant}><Plus className="w-4 h-4 mr-2" /> Tek Varyant</Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Bulk Variant Generator */}
                <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-lg border-2 border-dashed border-purple-200 dark:border-purple-800">
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        Toplu Varyant Oluştur
                        {!productCode && <span className="text-xs text-red-500 font-normal ml-2">(Önce Model Kodu girin)</span>}
                    </h3>
                    {/* ... (Keep bulk generator inputs exactly as is) */}
                    <div className="grid grid-cols-12 gap-3">
                        <div className="col-span-2">
                            <label className="text-xs font-medium text-muted-foreground">Başlangıç</label>
                            <Input
                                type="number"
                                placeholder="36"
                                value={bulkSizeStart}
                                onChange={(e) => setBulkSizeStart(e.target.value)}
                                className="h-9 text-sm"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="text-xs font-medium text-muted-foreground">Bitiş</label>
                            <Input
                                type="number"
                                placeholder="40"
                                value={bulkSizeEnd}
                                onChange={(e) => setBulkSizeEnd(e.target.value)}
                                className="h-9 text-sm"
                            />
                        </div>
                        <div className="col-span-5">
                            <label className="text-xs font-medium text-muted-foreground">Renkler (virgülle ayırın)</label>
                            <Input
                                placeholder="Mavi, Pembe, Siyah"
                                value={bulkColors}
                                onChange={(e) => setBulkColors(e.target.value)}
                                className="h-9 text-sm"
                            />
                        </div>
                        <div className="col-span-12 flex items-center gap-2 mb-2">
                            <input
                                type="checkbox"
                                id="doubleSize"
                                className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                checked={isDoubleSize}
                                onChange={(e) => setIsDoubleSize(e.target.checked)}
                            />
                            <label htmlFor="doubleSize" className="text-sm font-medium text-gray-700 dark:text-gray-300 select-none cursor-pointer">
                                Çift Numara (Örn: 36-37, 38-39)
                            </label>
                        </div>

                        <div className="col-span-12 flex justify-end">
                            <Button
                                onClick={generateBulkVariants}
                                className="w-full h-9 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 gap-2"
                            >
                                <Wand2 className="w-4 h-4" />
                                Oluştur
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Variants Table */}
                <div className="space-y-2">
                    <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-muted-foreground pb-2 border-b">
                        <div className="col-span-2">Beden</div>
                        <div className="col-span-3">Renk</div>
                        <div className="col-span-2">Adet</div>
                        <div className="col-span-2">Model Kodu (SKU)</div>
                        <div className="col-span-2">Barkod</div>
                        <div className="col-span-1"></div>
                    </div>

                    {variants.map((v, i) => (
                        <div key={`${i}-${v.size}-${v.color}`} className="grid grid-cols-12 gap-2 items-center">
                            {/* ... (keep input fields exactly as is) */}
                            <Input
                                placeholder="38"
                                value={v.size}
                                onChange={(e) => updateVariant(i, "size", e.target.value)}
                                className="col-span-2 h-9 text-sm"
                            />
                            <Input
                                placeholder="Siyah"
                                value={v.color}
                                onChange={(e) => updateVariant(i, "color", e.target.value)}
                                className="col-span-3 h-9 text-sm"
                            />
                            <Input
                                type="number"
                                placeholder="0"
                                value={String(v.qty)}
                                onChange={(e) => updateVariant(i, "qty", e.target.value)}
                                className="col-span-2 h-9 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                min="0"
                            />

                            <div className="col-span-2 text-xs font-mono bg-muted/50 px-2 py-2 rounded border truncate text-muted-foreground" title={productCode}>
                                {productCode || "-"}
                            </div>

                            <Input
                                value={v.barcode || ""}
                                onChange={(e) => {
                                    const newVariants = [...variants];
                                    newVariants[i].barcode = e.target.value;
                                    setVariants(newVariants);
                                }}
                                className="col-span-2 h-9 text-xs font-mono"
                                placeholder="Oto."
                            />

                            <Button variant="ghost" size="icon" className="col-span-1 h-9 text-destructive" onClick={() => removeVariant(i)}>
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    ))}

                    {variants.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                            Henüz varyant eklenmedi. Yukarıdan tek veya toplu ekleyebilirsiniz.
                        </div>
                    )}
                </div>

                {/* Color Settings Section */}
                {uniqueColors.length > 0 && (
                    <div className="pt-4 border-t space-y-4">
                        <h3 className="text-sm font-semibold flex items-center gap-2">
                            <ImageIcon className="w-4 h-4 text-blue-600" />
                            Renk Ayarları (Fotoğraf & Başlık)
                        </h3>

                        <div className="grid grid-cols-1 gap-4">
                            {uniqueColors.map(color => (
                                <div key={color} className="p-3 border rounded-lg bg-muted/20">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-3 h-3 rounded-full bg-primary" />
                                        <span className="font-bold text-sm">{color}</span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Custom Title */}
                                        <div className="space-y-1">
                                            <label className="text-xs text-muted-foreground">Varyant Özel Başlığı</label>
                                            <Input
                                                value={colorSettings[color]?.title || ""}
                                                onChange={(e) => updateColorSetting(color, "title", e.target.value)}
                                                className="h-8 text-sm"
                                                placeholder={`${productTitle || categoryName} - ${color}`}
                                            />
                                        </div>

                                        {/* Image Selection */}
                                        <div className="space-y-1">
                                            <label className="text-xs text-muted-foreground">Fotoğraf Seçimi (Birden fazla seçilebilir)</label>
                                            {files.length === 0 ? (
                                                <div className="text-xs text-muted-foreground italic h-8 flex items-center">
                                                    (Önce fotoğraf yükleyin)
                                                </div>
                                            ) : (
                                                <div className="flex gap-2 overflow-x-auto pb-2">
                                                    {files.map((file, idx) => {
                                                        const isSelected = colorSettings[color]?.imageIndices?.includes(idx);
                                                        return (
                                                            <div
                                                                key={idx}
                                                                onClick={() => toggleImageSelection(color, idx)}
                                                                className={`
                                                                    relative cursor-pointer border-2 rounded-md overflow-hidden flex-shrink-0 w-12 h-12 transition-all
                                                                    ${isSelected ? "border-blue-500 ring-2 ring-blue-200 opacity-100 scale-105" : "border-transparent opacity-60 hover:opacity-100"}
                                                                `}
                                                            >
                                                                <img
                                                                    src={URL.createObjectURL(file)}
                                                                    alt={`img-${idx}`}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                                {isSelected && (
                                                                    <div className="absolute top-0 right-0 bg-blue-500 text-white w-3 h-3 flex items-center justify-center rounded-bl-md text-[8px] font-bold">
                                                                        ✓
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
