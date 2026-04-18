import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { productId, variants, galleryImages } = body;

        if (!productId || !variants || !Array.isArray(variants)) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const productRef = adminDb.collection("products").doc(productId);
        const productSnap = await productRef.get();

        if (!productSnap.exists) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        const productData = productSnap.data();
        const parentSku = productData?.productCode || productData?.sku || productData?.barcode || "";

        // Yeni varyantları formatla ve mevcutlara ekle
        const existingVariants = productData?.variants || [];
        const formattedVariants = variants.map((v: Record<string, unknown>) => ({
            ...v,
            sku: parentSku
        }));
        existingVariants.push(...formattedVariants);

        // Galeri resmini güncelle
        let updatedImages = productData?.images || [];
        if (galleryImages && Array.isArray(galleryImages)) {
            for (const img of galleryImages) {
                if (img && !updatedImages.includes(img)) {
                    updatedImages = [...updatedImages, img];
                }
            }
        }

        // 1. Firebase'e kaydet
        await productRef.update({ 
            variants: existingVariants,
            images: updatedImages
        });

        console.log(`[Add Variant] ✅ Firebase kaydedildi. ${formattedVariants.length} yeni varyant eklendi. (SKU: ${parentSku})`);

        // 2. Ticimax'a otomatik gönder (Tıpkı ürün gönderir gibi tüm veriyi pushla)
        let ticimaxResult: unknown = null;
        try {
            // Fiyatı formatla
            let priceObj = productData?.price;
            if (!priceObj || typeof priceObj !== "object") {
                priceObj = { sale: 0, purchase: 0, currency: "TL", tax: 10 };
            }
            if (!priceObj.sale && typeof productData?.price === "number") {
                priceObj = { sale: productData.price, purchase: 0, currency: "TL", tax: 10 };
            }

            // Kategori kontrolü (Ticimax kategorisiz yeni ürün eklemeyi reddeder)
            const hasCategory = Number(productData?.categoryId) > 0;
            if (!hasCategory) {
                console.warn(`[Add Variant] Ticimax iptal: Kategori seçilmemiş.`);
                return NextResponse.json({
                    success: true, 
                    message: `${formattedVariants.length} varyant eklendi.`,
                    variantCount: formattedVariants.length,
                    ticimax: { 
                        success: false, 
                        error: "Ürüne Ticimax Kategorisi Seçilmemiş!\nLütfen ürünü düzenleyip bir Ticimax kategorisi seçin." 
                    }
                });
            }

            // Ticimax payloadını Ürün Gönder formatında tam hazırla
            const ticimaxPayload = {
                ...productData, // Firestore'daki diğer tüm kategoriler ve özellikler dahil
                variants: existingVariants, // Tüm varyantlar (eskiler + yeniler)
                images: updatedImages,
                price: {
                    sale: Number(priceObj.sale) || 0,
                    purchase: Number(priceObj.purchase) || 0,
                    currency: priceObj.currency || "TL",
                    tax: Number(priceObj.tax) || 10,
                }
            };

            const reqUrl = new URL(req.url);
            const baseUrl = `${reqUrl.protocol}//${reqUrl.host}`;
            
            console.log(`[Add Variant] Ticimax'a tam push gönderiliyor... URL: ${baseUrl}/api/ticimax/push`);
            
            const pushRes = await fetch(`${baseUrl}/api/ticimax/push`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(ticimaxPayload)
            });

            let pushData;
            try {
                pushData = await pushRes.json();
            } catch {
                pushData = { success: false, error: "Parse hatası: " + await pushRes.text() };
            }
            
            if (pushData.success) {
                console.log(`[Add Variant] ✅ Ticimax güncellendi/eklendi! ID: ${pushData.ticimaxId}`);
                ticimaxResult = { success: true, ticimaxId: pushData.ticimaxId };
            } else {
                const rawXml = pushData.rawResponse || pushData.details || "";
                console.warn(`[Add Variant] ❌ Ticimax hatası:`, pushData.error);
                ticimaxResult = { success: false, error: pushData.error || "Ticimax hata döndürdü", rawResponse: rawXml.substring(0, 1000) };
            }
        } catch (err) {
            console.error("[Add Variant] Ticimax bağlantı hatası:", err);
            ticimaxResult = { success: false, error: `Bağlantı hatası: ${String(err)}` };
        }

        return NextResponse.json({
            success: true,
            message: `${formattedVariants.length} varyant eklendi.`,
            variantCount: formattedVariants.length,
            ticimax: ticimaxResult
        });
    } catch (error: unknown) {
        console.error("Add Variant Error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}
