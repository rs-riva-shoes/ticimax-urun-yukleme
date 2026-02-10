import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ticimax Product Uploader",
  description: "Advanced product management system for Ticimax",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased bg-gradient-premium relative",
          inter.className
        )}
      >
        <div className="relative z-10 flex min-h-screen flex-col">
          {children}
        </div>
        {/* Background blobs or effects can be added here */}
      </body>
    </html>
  );
}
