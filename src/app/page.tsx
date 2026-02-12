import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Plus, Box, PackageOpen, ArrowRight, BarChart } from "lucide-react";
import { adminDb } from "@/lib/firebase-admin";

import { SyncDataButtons } from "@/components/settings/sync-data-buttons";

export const revalidate = 0; // Always fresh data

export default async function Dashboard() {
  // Quick stats fetch
  const productsSnapshot = await adminDb.collection("products").count().get();
  const totalProducts = productsSnapshot.data().count;

  // Get latest 5 products
  const latestSnapshot = await adminDb.collection("products")
    .orderBy("createdAt", "desc")
    .limit(5)
    .get();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const latestProducts = latestSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Ticimax Panel
          </h1>
          <p className="text-muted-foreground mt-2">
            Ürünlerinizi yönetin, AI ile içerik üretin ve Ticimax'a gönderin.
          </p>
        </div>
        <div className="flex flex-col gap-4 items-end">
          <SyncDataButtons />

          <div className="flex items-center gap-3">
            <Link href="/products">
              <Button variant="outline" className="gap-2">
                <Box className="w-4 h-4" /> Tüm Ürünler
              </Button>
            </Link>
            <Link href="/products/new">
              <Button variant="premium" className="gap-2 shadow-lg hover:shadow-xl transition-all">
                <Plus className="w-4 h-4" /> Yeni Ürün Ekle
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Ürün</CardTitle>
            <PackageOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              Sistemde kayıtlı toplam ürün sayısı
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bekleyen Gönderimler</CardTitle>
            <Box className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Ticimax'a gönderilmeyi bekleyen
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Kullanımı</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">%85</div>
            <p className="text-xs text-muted-foreground">
              Ürün içeriklerinde AI verimliliği
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Latest Products */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">Son Eklenenler</h2>
          <Link href="/products" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
            Tümünü Gör <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {latestProducts.map((product) => (
            <Link href={`/products/edit/${product.id}`} key={product.id}>
              <Card className="h-full hover:border-blue-500/50 transition-colors cursor-pointer group">
                <CardHeader className="p-4">
                  <div className="aspect-video relative bg-muted rounded-md overflow-hidden mb-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={product.images?.[0] || "https://via.placeholder.com/300x200?text=No+Image"}
                      alt={product.title}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 text-white text-xs rounded backdrop-blur-sm">
                      {product.price?.sale ? `${product.price.sale} ₺` : "Fiyatsız"}
                    </div>
                  </div>
                  <CardTitle className="text-base line-clamp-1">{product.title || "İsimsiz Ürün"}</CardTitle>
                  <CardDescription className="line-clamp-1">
                    {product.categoryName} • {product.brandName || "Markasız"}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}

          {latestProducts.length === 0 && (
            <div className="col-span-full text-center py-10 bg-muted/30 rounded-xl border border-dashed">
              <p className="text-muted-foreground">Henüz ürün eklenmemiş.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
