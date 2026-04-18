import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/layout/sidebar";

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
          <Sidebar />

          {/* ──────── Main Content ──────── */}
          <main className="flex-1 ml-[240px]">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
