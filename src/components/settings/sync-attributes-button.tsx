"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";

export function SyncAttributesButton() {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const handleSync = async () => {
        setLoading(true);
        setMessage(null);

        try {
            const res = await fetch("/api/settings/attributes/sync", {
                method: "POST"
            });
            const data = await res.json();

            if (data.success) {
                setMessage(`Başarılı! ${data.counts.mappedFeatures} özellik güncellendi.`);
            } else {
                setMessage(`Hata: ${data.error}`);
            }
        } catch (error) {
            setMessage("Bağlantı hatası oluştu.");
        } finally {
            setLoading(false);
            // Clear message after 3 seconds
            setTimeout(() => setMessage(null), 3000);
        }
    };

    return (
        <div className="flex flex-col items-end gap-2">
            <Button
                variant="outline"
                size="sm"
                onClick={handleSync}
                disabled={loading}
                className="gap-2 border-orange-200 hover:bg-orange-50 text-orange-700"
            >
                {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <RefreshCw className="h-4 w-4" />
                )}
                {loading ? "Çekiliyor..." : "Ticimax Teknik Detayları Güncelle"}
            </Button>
            {message && (
                <span className={`text-xs ${message.startsWith("Hata") ? "text-red-500" : "text-green-600"}`}>
                    {message}
                </span>
            )}
        </div>
    );
}
