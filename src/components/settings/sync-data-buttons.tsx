"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Box, User, Briefcase, Package } from "lucide-react";

type SyncType = "attributes" | "brands" | "suppliers" | "products";

interface SyncButtonProps {
    type: SyncType;
    label: string;
    icon: any;
    apiPath: string;
}

const syncOptions: SyncButtonProps[] = [
    { type: "attributes", label: "Teknik Detay", icon: Box, apiPath: "/api/settings/attributes/sync" },
    { type: "brands", label: "Marka", icon: User, apiPath: "/api/settings/brands/sync" },
    { type: "suppliers", label: "Tedarikçi", icon: Briefcase, apiPath: "/api/settings/suppliers/sync" },
    { type: "products", label: "Ürünler", icon: Package, apiPath: "/api/settings/products/sync" }
];

export function SyncDataButtons() {
    const [loadingType, setLoadingType] = useState<SyncType | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const handleSync = async (option: SyncButtonProps) => {
        setLoadingType(option.type);
        setMessage(null);

        try {
            const res = await fetch(option.apiPath, {
                method: "POST"
            });
            const data = await res.json();

            if (data.success) {
                setMessage(`✅ ${data.message || "Güncellendi"}`);
            } else {
                setMessage(`❌ Hata: ${data.error}`);
            }
        } catch (error) {
            setMessage("❌ Bağlantı hatası");
        } finally {
            setLoadingType(null);
            setTimeout(() => setMessage(null), 3000);
        }
    };

    return (
        <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground mr-1">Ticimax Güncelle:</span>
                {syncOptions.map((opt) => (
                    <Button
                        key={opt.type}
                        variant="outline"
                        size="sm"
                        onClick={() => handleSync(opt)}
                        disabled={loadingType !== null}
                        className="h-8 gap-1.5 px-3 border-dashed"
                        title={`${opt.label} Listesini Güncelle`}
                    >
                        {loadingType === opt.type ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                            <RefreshCw className="h-3 w-3" />
                        )}
                        <span className="sr-only sm:not-sr-only text-xs">{opt.label}</span>
                    </Button>
                ))}
            </div>
            {message && (
                <span className={`text-xs font-medium animate-pulse ${message.startsWith("❌") ? "text-red-500" : "text-green-600"
                    }`}>
                    {message}
                </span>
            )}
        </div>
    );
}
