"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LionIcon } from "@/components/icons/lion";
import {
  LayoutDashboard,
  Package,
  Plus,
  Settings,
  RefreshCw,
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();

  const mainLinks = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/products", label: "Ürünler", icon: Package },
    { href: "/products/new", label: "Yeni Ürün", icon: Plus },
  ];

  const systemLinks = [
    { href: "/sync", label: "Senkronizasyon", icon: RefreshCw },
    { href: "/settings", label: "Ayarlar", icon: Settings },
  ];

  return (
    <aside className="sidebar w-[240px] fixed inset-y-0 left-0 flex flex-col z-50 bg-stone-950">
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

        {mainLinks.map((link) => {
          const isActive = pathname === link.href || (link.href !== "/" && pathname?.startsWith(link.href));
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-sm"
                  : "text-stone-400 hover:text-white hover:bg-white/5 border border-transparent"
              )}
            >
              <Icon className={cn("w-4 h-4", isActive ? "text-amber-500" : "text-stone-400")} />
              {link.label}
            </Link>
          );
        })}

        <p className="text-[10px] font-semibold text-stone-600 uppercase tracking-wider px-3 py-2 mt-4">
          Sistem
        </p>

        {systemLinks.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-sm"
                  : "text-stone-400 hover:text-white hover:bg-white/5 border border-transparent"
              )}
            >
              <Icon className={cn("w-4 h-4", isActive ? "text-amber-500" : "text-stone-400")} />
              {link.label}
            </Link>
          );
        })}
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
  );
}
