import { Sparkles } from "lucide-react";
import { useState } from "react";
import hierarchicalCategories from "@/data/hierarchical-categories.json";
import productTypeCategories from "@/data/product-type-categories.json";
// brands.json import removed

interface CategorySelectorProps {
    hierarchicalCategoryName: string;
    setHierarchicalCategoryName: (value: string) => void;
    setHierarchicalCategoryIds: (ids: string[]) => void;
    hierarchicalCategoryIds: string[];
    productTypeCategoryId: string;
    setProductTypeCategoryId: (value: string) => void;
    setProductTypeCategoryName: (value: string) => void;
    selectedBrand: string;
    setSelectedBrand: (value: string) => void;
    setSelectedBrandName: (value: string) => void;
    suppliers: any[];
    selectedSupplier: string;
    setSelectedSupplier: (value: string) => void;
    onAddSupplier: (name: string, ticimaxId: string) => Promise<void>;
    brands: any[]; // Marka listesi
    onAddBrand: (name: string) => Promise<void>;
}

export function CategorySelector({
    hierarchicalCategoryName,
    setHierarchicalCategoryName,
    setHierarchicalCategoryIds,
    hierarchicalCategoryIds,
    productTypeCategoryId,
    setProductTypeCategoryId,
    setProductTypeCategoryName,
    selectedBrand,
    setSelectedBrand,
    setSelectedBrandName,
    suppliers = [],
    selectedSupplier,
    setSelectedSupplier,
    onAddSupplier,
    brands = [],
    onAddBrand
}: CategorySelectorProps) {
    const [isAddingSupplier, setIsAddingSupplier] = useState(false);
    const [newSupplierName, setNewSupplierName] = useState("");

    const [isAddingBrand, setIsAddingBrand] = useState(false);
    const [newBrandName, setNewBrandName] = useState("");

    const handleAddSupplier = async () => {
        if (!newSupplierName) return;
        // İkinci parametre artık dummy string ("")
        await onAddSupplier(newSupplierName, "");
        setIsAddingSupplier(false);
        setNewSupplierName("");
    };

    return (
        <div className="space-y-4">
            {/* Hierarchical Category */}
            <div className="space-y-1">
                <label className="text-xs font-semibold flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-purple-600" />
                    Hiyerarşik Kategori (KADIN/ERKEK/ÇOCUK)
                </label>
                <select
                    className="w-full text-sm p-2 rounded-md border bg-background/50"
                    value={hierarchicalCategoryName}
                    onChange={(e) => {
                        const selectedName = e.target.value;
                        setHierarchicalCategoryName(selectedName);
                        // Find and set the IDs
                        // @ts-ignore
                        for (const [mainCat, data] of Object.entries(hierarchicalCategories)) {
                            // @ts-ignore
                            const subcats = data.subcategories;
                            for (const [key, subdata] of Object.entries(subcats)) {
                                if ((subdata as any).name === selectedName) {
                                    setHierarchicalCategoryIds((subdata as any).ids);
                                    break;
                                }
                            }
                        }
                    }}
                >
                    <option value="">Kategori Seçiniz</option>
                    {Object.entries(hierarchicalCategories).map(([mainCat, data]) => {
                        const mainData = data as any;
                        return (
                            <optgroup key={mainCat} label={mainData.name}>
                                {Object.entries(mainData.subcategories).map(([key, subdata]) => {
                                    const subcatData = subdata as any;
                                    return (
                                        <option key={subcatData.name} value={subcatData.name}>
                                            {subcatData.name}
                                        </option>
                                    );
                                })}
                            </optgroup>
                        );
                    })}
                </select>
                {hierarchicalCategoryIds.length > 0 && (
                    <div className="text-xs text-purple-600 dark:text-purple-400 font-mono bg-purple-100/50 dark:bg-purple-900/20 px-2 py-1 rounded">
                        IDs: [{hierarchicalCategoryIds.join(", ")}]
                    </div>
                )}
            </div>

            {/* Product Type Category */}
            <div className="space-y-1">
                <label className="text-xs font-semibold flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-blue-600" />
                    Ürün Tipi
                </label>
                <select
                    className="w-full text-sm p-2 rounded-md border bg-background/50"
                    value={productTypeCategoryId}
                    onChange={(e) => {
                        const selectedId = e.target.value;
                        setProductTypeCategoryId(selectedId);
                        const selectedCat = productTypeCategories.find((c: any) => c.id === selectedId);
                        if (selectedCat) {
                            setProductTypeCategoryName((selectedCat as any).name);
                        }
                    }}
                >
                    <option value="">Ürün Tipi Seçiniz</option>
                    {productTypeCategories.map((cat: any) => (
                        <option key={cat.id} value={cat.id}>
                            {cat.name} ({cat.id})
                        </option>
                    ))}
                </select>
            </div>

            {/* Brand Selection */}
            <div className="space-y-1">
                <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-purple-600" />
                        Marka
                    </label>
                    <button
                        onClick={() => setIsAddingBrand(!isAddingBrand)}
                        className="text-[10px] text-blue-500 hover:underline"
                    >
                        {isAddingBrand ? "İptal" : "+ Yeni Ekle"}
                    </button>
                </div>

                {isAddingBrand ? (
                    <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded border space-y-2">
                        <input
                            type="text"
                            placeholder="Marka Adı"
                            className="w-full text-sm p-1 border rounded text-black"
                            value={newBrandName}
                            onChange={(e) => setNewBrandName(e.target.value)}
                        />
                        <button
                            onClick={async () => {
                                if (newBrandName) {
                                    await onAddBrand(newBrandName);
                                    setNewBrandName("");
                                    setIsAddingBrand(false);
                                }
                            }}
                            className="w-full bg-blue-600 text-white text-xs py-1 rounded hover:bg-blue-700"
                        >
                            Kaydet
                        </button>
                    </div>
                ) : (
                    <select
                        className="w-full text-sm p-2 rounded-md border bg-background/50"
                        value={selectedBrand}
                        onChange={(e) => {
                            const selectedId = e.target.value;
                            setSelectedBrand(selectedId);
                            const found = brands.find((b: any) => b.ticimaxId.toString() === selectedId);
                            if (found) setSelectedBrandName(found.name);
                        }}
                    >
                        <option value="">Marka Seçiniz</option>
                        {brands.map((brand: any) => (
                            <option key={brand.ticimaxId} value={brand.ticimaxId}>
                                {brand.name}
                            </option>
                        ))}
                    </select>
                )}
            </div>

            {/* Supplier Selection */}
            <div className="space-y-1">
                <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-green-600" />
                        Tedarikçi
                    </label>
                    <button
                        onClick={() => setIsAddingSupplier(!isAddingSupplier)}
                        className="text-[10px] text-blue-500 hover:underline"
                    >
                        {isAddingSupplier ? "İptal" : "+ Yeni Ekle"}
                    </button>
                </div>

                {isAddingSupplier ? (
                    <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded border space-y-2">
                        <input
                            type="text"
                            placeholder="Tedarikçi Adı"
                            className="w-full text-sm p-1 border rounded text-black"
                            value={newSupplierName}
                            onChange={(e) => setNewSupplierName(e.target.value)}
                        />
                        {/* Ticimax ID otomatik oluşur, girişe gerek yok */}
                        <button
                            onClick={() => {
                                if (newSupplierName) onAddSupplier(newSupplierName, ""); // ID boş gönderilir
                                setNewSupplierName("");
                                setIsAddingSupplier(false);
                            }}
                            className="w-full bg-blue-600 text-white text-xs py-1 rounded hover:bg-blue-700"
                        >
                            Kaydet
                        </button>
                    </div>
                ) : (
                    <select
                        className="w-full text-sm p-2 rounded-md border bg-background/50"
                        value={selectedSupplier}
                        onChange={(e) => setSelectedSupplier(e.target.value)}
                    >
                        <option value="">Tedarikçi Seçiniz (Varsayılan: 1)</option>
                        {suppliers.map((sup) => (
                            <option key={sup.id || sup.ticimaxId} value={sup.ticimaxId}>
                                {sup.name} ({sup.ticimaxId})
                            </option>
                        ))}
                    </select>
                )}
            </div>
        </div>
    );
}
