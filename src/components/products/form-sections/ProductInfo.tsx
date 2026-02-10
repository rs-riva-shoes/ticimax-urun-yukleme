import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Wand2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductInfoProps {
    title: string;
    setTitle: (value: string) => void;
    description: string;
    setDescription: (value: string) => void;
    productCode: string;
    setProductCode: (value: string) => void;
    brandName?: string;
    categoryName?: string;
    gender?: string; // Hierarchical category usually implies gender/segment
    handleAiFill: () => void;
    aiLoading: boolean;
    nameSuggesting: boolean;
    hasFiles: boolean;
}

export function ProductInfo({
    title,
    setTitle,
    description,
    setDescription,
    productCode,
    setProductCode,
    brandName,
    categoryName,
    gender,
    handleAiFill,
    aiLoading,
    nameSuggesting,
    hasFiles
}: ProductInfoProps) {

    // Akıllı Model Kodu Oluşturucu
    const generateRandomCode = () => {
        if (!brandName || !categoryName) {
            alert("Lütfen önce kategori ve marka seçimi yapınız!");
            return;
        }

        // Yardımcı fonksiyon: Metni temizle, boşlukları sil, büyük harf yap, Türkçe karakterleri düzelt
        const clean = (text: string) => text?.toUpperCase()
            .replace(/İ/g, "I").replace(/Ğ/g, "G").replace(/Ü/g, "U").replace(/Ş/g, "S").replace(/Ö/g, "O").replace(/Ç/g, "C")
            .replace(/[^A-Z0-9]/g, "") // Sadece harf ve rakam
            .substring(0, 3);

        const brandCode = clean(brandName);
        const catCode = clean(categoryName);

        // Cinsiyet kodlaması (KADIN -> K, ERKEK -> E, ÇOCUK -> C gibi)
        let genderCode = "U"; // Unisex
        if (gender?.toUpperCase().includes("KADIN")) genderCode = "K";
        else if (gender?.toUpperCase().includes("ERKEK")) genderCode = "E";
        else if (gender?.toUpperCase().includes("COCUK") || gender?.toUpperCase().includes("BEBEK")) genderCode = "C";

        const randomNum = Math.floor(1000 + Math.random() * 9000); // 4 haneli sayı

        // Format: MARKA-KAT-C-1234
        setProductCode(`${brandCode}-${catCode}-${genderCode}-${randomNum}`);
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <label className="text-sm font-medium">Ürün Adı</label>
                <div className="flex gap-2">
                    <div className="flex-1 relative">
                        <Input
                            placeholder={nameSuggesting ? "AI isim öneriyor..." : "Ürün adını girin..."}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            disabled={nameSuggesting}
                            className={cn(nameSuggesting && "animate-pulse")}
                        />
                        {nameSuggesting && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <Wand2 className="w-4 h-4 animate-spin text-purple-600" />
                            </div>
                        )}
                    </div>
                    <Button
                        onClick={handleAiFill}
                        disabled={aiLoading || nameSuggesting}
                        className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
                    >
                        {aiLoading ? (
                            <Wand2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Sparkles className="w-4 h-4" />
                        )}
                        AI Doldur
                    </Button>
                </div>
                {nameSuggesting ? (
                    <p className="text-xs text-purple-600 dark:text-purple-400 flex items-center gap-1">
                        <Wand2 className="w-3 h-3 animate-spin" />
                        Fotoğraflardan isim önerisi alınıyor...
                    </p>
                ) : hasFiles ? (
                    <p className="text-xs text-purple-600 dark:text-purple-400 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        AI görselleri analiz ederek kategori, açıklama ve özellikleri otomatik belirleyecek
                    </p>
                ) : (
                    <p className="text-xs text-muted-foreground">
                        💡 Önce fotoğraf yükleyin, AI otomatik isim önerecek
                    </p>
                )}
            </div>

            {/* Model Kodu Alanı */}
            <div className="space-y-2">
                <label className="text-sm font-medium">Model / Stok Kodu (Grup İsmi)</label>
                <div className="flex gap-2">
                    <Input
                        placeholder="Örn: TSHIRT-001"
                        value={productCode}
                        onChange={(e) => setProductCode(e.target.value.toUpperCase())}
                        className="font-mono bg-background/50"
                    />
                    <Button variant="outline" onClick={generateRandomCode} title="Akıllı Kod Oluştur">
                        <RefreshCw className="w-4 h-4" />
                        <span className="sr-only">Oluştur</span>
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                    Bu kod tüm varyantlarda ortak "Stok Kodu" olarak kullanılacak. Barkodlar ise buna göre türetilecek (Örn: {productCode || "KOD"}-S-KHV).
                </p>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">Açıklama (HTML)</label>
                <textarea
                    className="flex min-h-[140px] w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm glass focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
                    placeholder="Ürün açıklaması..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
            </div>
        </div>
    );
}
