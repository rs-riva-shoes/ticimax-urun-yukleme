import { Button } from "@/components/ui/button";
import { X, CheckCircle2, Truck, Tag, Box, Info } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";

interface ReviewModalProps {
    showReview: boolean;
    setShowReview: (show: boolean) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload: any;
    files?: File[];
    handlePush: () => void;
    pushStatus: "idle" | "pushing" | "success" | "error";
}

export function ReviewModal({
    showReview,
    setShowReview,
    payload,
    files = [],
    handlePush,
    pushStatus
}: ReviewModalProps) {
    if (!showReview) return null;

    // Helper for formatting currency
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(price);
    };

    // Create preview URL for the first image if available
    const coverImage = files.length > 0 ? URL.createObjectURL(files[0]) : null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-background border rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
            >
                <div className="p-4 border-b flex justify-between items-center bg-muted/30">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <h2 className="text-lg font-bold">Önizleme & Onay</h2>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setShowReview(false)}>
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="p-6 space-y-6">
                        {/* Header Section: Image & Basic Info */}
                        <div className="flex gap-6 flex-col md:flex-row">
                            <div className="w-full md:w-48 h-48 bg-muted rounded-lg flex-shrink-0 relative overflow-hidden border">
                                {coverImage ? (
                                    <Image
                                        src={coverImage}
                                        alt="Product Preview"
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
                                        Görsel Yok
                                    </div>
                                )}
                                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                                    +{files.length > 1 ? files.length - 1 : 0} Görsel
                                </div>
                            </div>

                            <div className="flex-1 space-y-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <span className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 mb-2 mr-2">
                                            {payload.brandName || "Markasız"}
                                        </span>
                                        <span className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors border-transparent bg-primary text-primary-foreground hover:bg-primary/80 mb-2">
                                            {payload.categoryName || "Kategorisiz"}
                                        </span>
                                        <h1 className="text-xl font-bold leading-tight">{payload.title}</h1>
                                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground font-mono">
                                            <Tag className="w-3 h-3" />
                                            {payload.productCode || "-"}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-green-600">
                                            {formatPrice(payload.price.sale)}
                                        </div>
                                        {payload.price.discount > 0 && (
                                            <div className="text-sm text-muted-foreground line-through decoration-red-500">
                                                {formatPrice(payload.price.purchase)}
                                            </div>
                                        )}
                                        <div className="text-xs text-muted-foreground mt-1">
                                            +{payload.price.tax}% KDV
                                        </div>
                                    </div>
                                </div>

                                <div className="p-3 bg-muted/50 rounded-lg text-sm border grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <span className="text-muted-foreground block text-xs">Alış Fiyatı</span>
                                        <span className="font-mono">{formatPrice(payload.price.purchase)}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block text-xs">İndirimli</span>
                                        <span className="font-mono">{payload.price.discount > 0 ? formatPrice(payload.price.discount) : "-"}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block text-xs">Para Birimi</span>
                                        <span className="font-mono">{payload.price.currency}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block text-xs">Varyant Sayısı</span>
                                        <span className="font-mono font-bold">{payload.variants.length}</span>
                                    </div>
                                </div>

                                {/* Description Preview (Short) */}
                                <div className="text-sm text-muted-foreground line-clamp-2" dangerouslySetInnerHTML={{ __html: payload.description }} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Attributes */}
                            <div className="border rounded-lg p-4 space-y-3">
                                <h3 className="font-semibold text-sm flex items-center gap-2">
                                    <Info className="w-4 h-4" />
                                    Ürün Özellikleri
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {payload.selectedAttributes && payload.selectedAttributes.length > 0 ? (
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                        payload.selectedAttributes.map((attr: any, i: number) => (
                                            <span key={i} className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                                                <span className="font-bold mr-1">{attr.name}:</span> {attr.valueName}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-sm text-muted-foreground">Özellik seçilmedi.</span>
                                    )}
                                </div>
                            </div>

                            {/* Shipping Info */}
                            <div className="border rounded-lg p-4 space-y-3">
                                <h3 className="font-semibold text-sm flex items-center gap-2">
                                    <Truck className="w-4 h-4" />
                                    Kargo & Ölçüler
                                </h3>
                                {payload.dimensions ? (
                                    <div className="grid grid-cols-4 gap-2 text-sm text-center">
                                        <div className="bg-muted/30 p-2 rounded">
                                            <div className="text-xs text-muted-foreground">Desi</div>
                                            <div className="font-bold">{((payload.dimensions.width * payload.dimensions.height * payload.dimensions.depth) / 3000).toFixed(2)}</div>
                                        </div>
                                        <div className="bg-muted/30 p-2 rounded">
                                            <div className="text-xs text-muted-foreground">En</div>
                                            <div>{payload.dimensions.width}</div>
                                        </div>
                                        <div className="bg-muted/30 p-2 rounded">
                                            <div className="text-xs text-muted-foreground">Boy</div>
                                            <div>{payload.dimensions.height}</div>
                                        </div>
                                        <div className="bg-muted/30 p-2 rounded">
                                            <div className="text-xs text-muted-foreground">Yük.</div>
                                            <div>{payload.dimensions.depth}</div>
                                        </div>
                                    </div>
                                ) : (
                                    <span className="text-sm text-muted-foreground">Ölçü bilgisi girilmedi.</span>
                                )}
                            </div>
                        </div>

                        {/* Variants Table */}
                        <div className="border rounded-lg overflow-hidden">
                            <div className="bg-muted/50 p-3 border-b flex items-center gap-2">
                                <Box className="w-4 h-4" />
                                <h3 className="font-semibold text-sm">Varyant Listesi</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-muted-foreground bg-muted/20 uppercase">
                                        <tr>
                                            <th className="px-4 py-3">Beden</th>
                                            <th className="px-4 py-3">Renk</th>
                                            <th className="px-4 py-3 text-center">Stok</th>
                                            <th className="px-4 py-3">Barkod</th>
                                            <th className="px-4 py-3">SKU (Grup)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                        {payload.variants.map((v: any, i: number) => (
                                            <tr key={i} className="hover:bg-muted/10">
                                                <td className="px-4 py-2 font-medium">{v.size}</td>
                                                <td className="px-4 py-2">{v.color}</td>
                                                <td className="px-4 py-2 text-center w-24">
                                                    <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                                        {v.qty} Adet
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2 font-mono text-xs">{v.barcode || "-"}</td>
                                                <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{v.sku || "-"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>
                </div>

                <div className="p-4 border-t flex justify-between items-center bg-muted/20">
                    <span className="text-xs text-muted-foreground">
                        *Onayladığınızda ürün Ticimax'a gönderilecek ve veritabanına kaydedilecektir.
                    </span>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={() => setShowReview(false)}>Düzenle</Button>
                        <Button
                            className="bg-purple-600 hover:bg-purple-700 text-white min-w-[140px]"
                            onClick={handlePush}
                            disabled={pushStatus === "pushing" || pushStatus === "success"}
                        >
                            {pushStatus === "pushing" ? "Gönderiliyor..." : pushStatus === "success" ? "Başarılı!" : "Onayla & Gönder"}
                        </Button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
