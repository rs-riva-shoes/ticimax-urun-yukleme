import Link from "next/link";
import { adminDb } from "@/lib/firebase-admin";
import { SyncDataButtons } from "@/components/settings/sync-data-buttons";
import {
  PackageOpen,
  TrendingUp,
  Clock,
  ArrowRight,
  Plus,
  Layers,
} from "lucide-react";

export const revalidate = 0;

export default async function Dashboard() {
  // Real stats
  const productsSnapshot = await adminDb.collection("products").count().get();
  const totalProducts = productsSnapshot.data().count;

  // Count active products (those with status 'published')
  const activeSnapshot = await adminDb.collection("products").where("status", "==", "published").count().get();
  const activeProducts = activeSnapshot.data().count;

  // Latest 6 products
  const latestSnapshot = await adminDb
    .collection("products")
    .orderBy("createdAt", "desc")
    .limit(6)
    .get();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const latestProducts = latestSnapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() }) as any
  );

  return (
    <div className="p-8 space-y-8">
      {/* ── Header ── */}
      <div className="flex items-center justify-between animate-fade-in-up">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-stone-900">
            Hoş geldin, <span className="shimmer-text">Arslan</span> 🦁
          </h1>
          <p className="text-stone-500 mt-1">
            İşte panelinin güncel durumu.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <SyncDataButtons />
          <Link href="/products/new">
            <button className="btn-arslan flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" />
              Yeni Ürün
            </button>
          </Link>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Toplam Ürün */}
        <div className="stat-card animate-fade-in-up animate-fade-in-up-1">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-stone-500">
              Toplam Ürün
            </span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
              <PackageOpen className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-stone-900">
            {totalProducts}
          </p>
          <p className="text-xs text-stone-400 mt-1">
            Sistemde kayıtlı ürün
          </p>
        </div>

        {/* Aktif Ürünler */}
        <div className="stat-card animate-fade-in-up animate-fade-in-up-2">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-stone-500">
              Aktif Ürünler
            </span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Layers className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-stone-900">
            {activeProducts}
          </p>
          <p className="text-xs text-stone-400 mt-1">
            Yayında olan ürünler
          </p>
        </div>

        {/* Son Eklenen */}
        <div className="stat-card animate-fade-in-up animate-fade-in-up-3">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-stone-500">
              Son Eklenen
            </span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-stone-900">
            {latestProducts[0]?.createdAt
              ? new Date(
                (latestProducts[0].createdAt._seconds || latestProducts[0].createdAt.seconds || 0) * 1000
              ).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })
              : "-"}
          </p>
          <p className="text-xs text-stone-400 mt-1 line-clamp-1">
            {latestProducts[0]?.title || "Henüz ürün yok"}
          </p>
        </div>
      </div>

      {/* ── Recent Products ── */}
      <div className="space-y-4 animate-fade-in-up animate-fade-in-up-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-stone-800">Son Eklenenler</h2>
          <Link
            href="/products"
            className="text-sm font-medium text-amber-600 hover:text-amber-700 flex items-center gap-1 transition-colors"
          >
            Tümünü Gör <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {latestProducts.map((product) => (
            <Link
              href={`/products/edit/${product.id}`}
              key={product.id}
              className="product-card group"
            >
              <div className="aspect-[4/3] relative bg-stone-100 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    product.images?.[0] ||
                    "https://via.placeholder.com/400x300?text=No+Image"
                  }
                  alt={product.title}
                  className="product-image object-cover w-full h-full"
                />
                {/* Price badge */}
                <div className="absolute top-3 right-3 price-tag">
                  {product.price?.sale
                    ? `${Number(product.price.sale).toLocaleString("tr-TR")} ₺`
                    : "Fiyatsız"}
                </div>
                {/* Status badge */}
                <div className="absolute bottom-3 left-3 badge-green">
                  {product.status || "Aktif"}
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-stone-800 line-clamp-1 group-hover:text-amber-700 transition-colors">
                  {product.title || "İsimsiz Ürün"}
                </h3>
                <p className="text-sm text-stone-400 mt-0.5 line-clamp-1">
                  {product.categoryName} • {product.brandName || "Markasız"}
                </p>
              </div>
            </Link>
          ))}

          {latestProducts.length === 0 && (
            <div className="col-span-full text-center py-16 bg-stone-50 rounded-xl border border-dashed border-stone-200">
              <PackageOpen className="w-10 h-10 text-stone-300 mx-auto mb-3" />
              <p className="text-stone-500 font-medium">
                Henüz ürün eklenmemiş.
              </p>
              <Link href="/products/new">
                <button className="btn-arslan mt-4 text-sm">
                  İlk Ürünü Ekle
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
