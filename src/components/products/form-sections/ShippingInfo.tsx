import { Input } from "@/components/ui/input";
import { Truck } from "lucide-react";
import { useEffect, useState } from "react";

interface Dimensions {
    width: string;
    height: string;
    depth: string;
    weight: string;
}

interface ShippingInfoProps {
    dimensions: Dimensions;
    setDimensions: (value: Dimensions | ((prev: Dimensions) => Dimensions)) => void;
}

export function ShippingInfo({ dimensions, setDimensions }: ShippingInfoProps) {
    const [desi, setDesi] = useState<number>(0);

    useEffect(() => {
        const w = parseFloat(dimensions.width) || 0;
        const h = parseFloat(dimensions.height) || 0;
        const d = parseFloat(dimensions.depth) || 0;
        // Standart Desi Formülü: (En x Boy x Yükseklik) / 3000
        const calculatedDesi = (w * h * d) / 3000;
        setDesi(parseFloat(calculatedDesi.toFixed(2)));
    }, [dimensions]);

    const handleChange = (field: keyof Dimensions, value: string) => {
        setDimensions(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                <Truck className="w-4 h-4" />
                Kargo & Teslimat
            </h3>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                    <label className="text-xs font-medium">En (cm)</label>
                    <Input
                        type="number"
                        placeholder="0"
                        value={dimensions.width}
                        onChange={(e) => handleChange("width", e.target.value)}
                        className="h-9"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-medium">Boy (cm)</label>
                    <Input
                        type="number"
                        placeholder="0"
                        value={dimensions.height}
                        onChange={(e) => handleChange("height", e.target.value)}
                        className="h-9"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-medium">Yükseklik (cm)</label>
                    <Input
                        type="number"
                        placeholder="0"
                        value={dimensions.depth}
                        onChange={(e) => handleChange("depth", e.target.value)}
                        className="h-9"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-medium">Ağırlık (kg)</label>
                    <Input
                        type="number"
                        placeholder="0.00"
                        value={dimensions.weight}
                        onChange={(e) => handleChange("weight", e.target.value)}
                        className="h-9"
                    />
                </div>
            </div>

            <div className="bg-muted/30 p-3 rounded-md border text-xs text-muted-foreground flex justify-between items-center">
                <span>Otomatik Desi Hesabı:</span>
                <span className="font-mono font-bold text-foreground">{desi > 0 ? `${desi} Desi` : "-"}</span>
            </div>
        </div>
    );
}
