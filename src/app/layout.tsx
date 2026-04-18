import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/utils";
import { Sidebar } from "@/components/layout/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Arslan Panel | Ürün Yönetim Sistemi",
  description: "Arslan Ailesine Özel Gelişmiş Ürün Yönetim Paneli - Ticimax Entegrasyon ve AI Destekli Ürün Yönetimi",
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    title: "Arslan Panel | Ürün Yönetim Sistemi",
    description: "Arslan Ailesine Özel Gelişmiş Ürün Yönetim Paneli",
    url: "https://panel.arslan.com",
    siteName: "Arslan Panel",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Arslan Panel Social Preview",
      },
    ],
    locale: "tr_TR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Arslan Panel | Ürün Yönetim Sistemi",
    description: "Arslan Ailesine Özel Gelişmiş Ürün Yönetim Paneli",
    images: ["/og-image.png"],
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
