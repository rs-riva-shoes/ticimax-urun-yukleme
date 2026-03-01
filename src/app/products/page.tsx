import { adminDb } from "@/lib/firebase-admin";
import Link from "next/link";
import { Plus, Package, ArrowLeft } from "lucide-react";
import { ProductCard } from "@/components/products/ProductCard";

export const revalidate = 0;

export default async function ProductsPage() {
    const snapshot = await adminDb
        .collection("products")
        .orderBy("createdAt", "desc")
        .get();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const products = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as any
    );

    return (
        <div className="p-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between animate-fade-in-up">
                <div className="flex items-center gap-3">
                    <Link
                        href="/"
                        className="w-9 h-9 rounded-lg bg-stone-100 hover:bg-stone-200 flex items-center justify-center transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 text-stone-600" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-extrabold text-stone-900">Ürünler</h1>
                        <p className="text-sm text-stone-500">
                            Toplam {products.length} ürün listeleniyor
                        </p>
                    </div>
                </div>
                <Link href="/products/new">
                    <button className="btn-arslan flex items-center gap-2 text-sm">
                        <Plus className="w-4 h-4" />
                        Yeni Ürün
                    </button>
                </Link>
            </div>

            {/* Products */}
            {products.length === 0 ? (
                <div className="text-center py-24 bg-stone-50 rounded-2xl border border-dashed border-stone-200 animate-fade-in-up animate-fade-in-up-1">
                    <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Package className="w-8 h-8 text-stone-400" />
                    </div>
                    <h3 className="text-lg font-bold text-stone-700">Henüz ürün yok</h3>
                    <p className="text-stone-500 mt-2 mb-6">
                        İlk ürününüzü ekleyerek başlayın.
                    </p>
                    <Link href="/products/new">
                        <button className="btn-arslan text-sm">Ürün Ekle</button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 animate-fade-in-up animate-fade-in-up-1">
                    {products.map((product: any) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            )}
        </div>
    );
}

