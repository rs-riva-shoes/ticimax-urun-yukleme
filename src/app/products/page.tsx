import { adminDb } from "@/lib/firebase-admin";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, Edit, Trash2, Package } from "lucide-react";
import Image from "next/image";

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
                                    <tr key={product.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                                        <td className="p-4">
                                            <div className="relative w-12 h-16 bg-muted rounded overflow-hidden border">
                                                {product.images?.[0] ? (
                                                    <Image
                                                        src={product.images[0]}
                                                        alt={product.title}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                                                        No Img
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 font-medium">
                                            <div className="line-clamp-2">{product.title || "İsimsiz Ürün"}</div>
                                            <div className="text-xs text-muted-foreground mt-1 font-mono">{product.sku || (product.variants?.[0]?.sku) || "-"}</div>
                                        </td>
                                        <td className="p-4 text-muted-foreground">
                                            {product.categoryName || "-"}
                                            <div className="text-xs">{product.hierarchicalCategoryName}</div>
                                        </td>
                                        <td className="p-4 text-muted-foreground">
                                            {product.brandName || "-"}
                                        </td>
                                        <td className="p-4 font-mono font-medium">
                                            {product.price?.sale ? `${product.price.sale} ₺` : "-"}
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                                {product._meta?.totalStock || 0}
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                                ${product.status === 'success' ? 'bg-green-100 text-green-800' :
                                                    product.status === 'draft' ? 'bg-gray-100 text-gray-800' : 'bg-red-100 text-red-800'}`}>
                                                {product.status || 'draft'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button size="icon" variant="ghost" className="h-8 w-8">
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive">
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
