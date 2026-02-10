import { Input } from "@/components/ui/input";

interface PricingInfoProps {
    purchasePrice: string;
    setPurchasePrice: (value: string) => void;
    salePrice: string;
    setSalePrice: (value: string) => void;
    discountPrice: string;
    setDiscountPrice: (value: string) => void;
    taxRate: string;
    setTaxRate: (value: string) => void;
}

export function PricingInfo({
    purchasePrice,
    setPurchasePrice,
    salePrice,
    setSalePrice,
    discountPrice,
    setDiscountPrice,
    taxRate,
    setTaxRate
}: PricingInfoProps) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
                <label className="text-sm font-medium">Alış Fiyatı</label>
                <Input
                    type="number"
                    placeholder="0.00"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    className="font-mono"
                />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium">Satış Fiyatı ⭐</label>
                <Input
                    type="number"
                    placeholder="0.00"
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                    className="font-mono"
                />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium">İndirimli Fiyat</label>
                <Input
                    type="number"
                    placeholder="0.00"
                    value={discountPrice}
                    onChange={(e) => setDiscountPrice(e.target.value)}
                    className="font-mono"
                />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium">KDV %</label>
                <Input
                    type="number"
                    placeholder="10"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    className="font-mono"
                />
            </div>
        </div>
    );
}
