import { adminDb } from "@/lib/firebase-admin";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, Edit, Trash2, Package, Search, ArrowLeft } from "lucide-react";

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
                        <div key={product.id} className="product-card group">
                            {/* Image */}
                            <div className="aspect-square relative bg-stone-100 overflow-hidden">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={
                                        product.images?.[0] ||
                                        "https://via.placeholder.com/400x400?text=No+Image"
                                    }
                                    alt={product.title}
                                    className="product-image object-cover w-full h-full"
                                />
                                {/* Price */}
                                <div className="absolute top-3 right-3 price-tag">
                                    {product.price?.sale
                                        ? `${Number(product.price.sale).toLocaleString("tr-TR")} ₺`
                                        : "–"}
                                </div>
                                {/* Hover overlay */}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                                    <Link href={`/products/edit/${product.id}`}>
                                        <button className="w-10 h-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition-colors shadow-lg">
                                            <Edit className="w-4 h-4 text-stone-700" />
                                        </button>
                                    </Link>
                                    <button className="w-10 h-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition-colors shadow-lg">
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                    </button>
                                </div>
                            </div>
                            {/* Info */}
                            <div className="p-3.5">
                                <h3 className="font-semibold text-sm text-stone-800 line-clamp-1 group-hover:text-amber-700 transition-colors">
                                    {product.title || "İsimsiz Ürün"}
                                </h3>
                                <p className="text-xs text-stone-400 mt-0.5 line-clamp-1">
                                    {product.brandName || "Markasız"}
                                </p>
                                <div className="flex items-center justify-between mt-2">
                                    <span className="badge-gold text-[11px]">
                                        {product.categoryName || "Kategori yok"}
                                    </span>
                                    <span className="text-xs text-stone-400">
                                        {product.variants?.length || 0} varyant
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
