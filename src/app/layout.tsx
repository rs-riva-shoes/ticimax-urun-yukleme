import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { LionIcon } from "@/components/icons/lion";
import {
  LayoutDashboard,
  Package,
  Plus,
  Settings,
  RefreshCw,
} from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Arslan Panel | Ürün Yönetim Sistemi",
  description: "Arslan Ailesine Özel Gelişmiş Ürün Yönetim Paneli",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.className
        )}
      >
        <div className="flex min-h-screen">
          {/* ──────── Sidebar ──────── */}
          <aside className="sidebar w-[240px] fixed inset-y-0 left-0 flex flex-col z-50">
            {/* Brand */}
            <div className="p-5 flex items-center gap-3 border-b border-white/5">
              <LionIcon size={40} className="rounded-full" />
              <div>
                <h2 className="text-white font-extrabold text-lg tracking-tight leading-none">
                  ARSLAN
                </h2>
                <span className="text-[10px] font-medium tracking-[0.2em] text-amber-500/80 uppercase">
                  Panel
                </span>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-1">
              <p className="text-[10px] font-semibold text-stone-600 uppercase tracking-wider px-3 py-2">
                Ana Menü
              </p>
              <Link href="/" className="sidebar-link">
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
              <Link href="/products" className="sidebar-link">
                <Package className="w-4 h-4" />
                Ürünler
              </Link>
              <Link href="/products/new" className="sidebar-link">
                <Plus className="w-4 h-4" />
                Yeni Ürün
              </Link>

              <p className="text-[10px] font-semibold text-stone-600 uppercase tracking-wider px-3 py-2 mt-4">
                Sistem
              </p>
              <Link href="/" className="sidebar-link">
                <RefreshCw className="w-4 h-4" />
                Senkronizasyon
              </Link>
              <Link href="/" className="sidebar-link">
                <Settings className="w-4 h-4" />
                Ayarlar
              </Link>
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white font-bold text-xs">
                  A
                </div>
                <div>
                  <p className="text-xs text-stone-300 font-medium">Arslan</p>
                  <p className="text-[10px] text-stone-600">Yönetici</p>
                </div>
              </div>
            </div>
          </aside>

          {/* ──────── Main Content ──────── */}
          <main className="flex-1 ml-[240px]">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
