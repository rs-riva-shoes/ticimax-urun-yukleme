import { adminDb } from "@/lib/firebase-admin";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, Edit, Trash2, Package } from "lucide-react";
import Image from "next/image";
import ProductRow from "@/components/products/ProductRow";

// Revalidate every 0 seconds (always fresh)
export const revalidate = 0;

export default async function ProductsPage() {
    const productsSnapshot = await adminDb.collection("products").orderBy("createdAt", "desc").get();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

    return (
        <div className="container mx-auto py-10 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Ürünler</h1>
                    <p className="text-muted-foreground mt-2">
                        Toplam {products.length} ürün listeleniyor.
                    </p>
                </div>
                <Link href="/products/new">
                    <Button variant="premium" className="gap-2">
                        <Plus className="w-4 h-4" /> Yeni Ürün Ekle
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {products.length === 0 ? (
                    <div className="text-center py-20 bg-muted/30 rounded-xl border border-dashed">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                            <Package className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold">Henüz ürün yok</h3>
                        <p className="text-muted-foreground mt-2 mb-6">İlk ürününüzü ekleyerek başlayın.</p>
                        <Link href="/products/new">
                            <Button>Ürün Ekle</Button>
                        </Link>
                    </div>
                ) : (
                    <div className="border rounded-xl bg-background overflow-hidden relative">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/50 text-left">
                                    <th className="p-4 font-medium w-[80px]">Resim</th>
                                    <th className="p-4 font-medium">Ürün Adı</th>
                                    <th className="p-4 font-medium">Kategori</th>
                                    <th className="p-4 font-medium">Marka</th>
                                    <th className="p-4 font-medium">Fiyat (Satış)</th>
                                    <th className="p-4 font-medium text-center">Stok</th>
                                    <th className="p-4 font-medium text-center">Durum</th>
                                    <th className="p-4 font-medium text-right">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map((product: any) => (
                                    <ProductRow key={product.id} product={product} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
