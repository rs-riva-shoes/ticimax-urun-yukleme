import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { generateSKU } from "@/lib/sku-generator";

export async function POST(req: Request) {
    try {
        const { productId, size, color, categoryId, categoryName } = await req.json();

        if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 });
        if (!size) return NextResponse.json({ error: "size required" }, { status: 400 });
        if (!color) return NextResponse.json({ error: "color required" }, { status: 400 });

        // Use provided category info or fetch from product
        let finalCategoryId = categoryId;
        let finalCategoryName = categoryName;

        const productRef = adminDb.collection("products").doc(productId);

        // Generate YYYYMM for counter
        const date = new Date();
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const period = `${yyyy}${mm}`;

        const counterRef = adminDb.collection("counters").doc(period);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await adminDb.runTransaction(async (t: any) => {
            const productDoc = await t.get(productRef);
            const productData = productDoc.exists ? productDoc.data() : null;
            if (!productDoc.exists) throw new Error("Product not found");

            // If category not provided, try to get from product data
            if (!finalCategoryId && productData) {
                finalCategoryId = productData.categoryId || "102";
                finalCategoryName = productData.categoryName || "Kadın Ayakkabı";
            }

            // Fallback to default
            if (!finalCategoryId) {
                finalCategoryId = "102";
                finalCategoryName = "Kadın Ayakkabı";
            }

            // Check if SKU already exists for this size/color combination
            const existingVariants = productData?.variants || [];
            const existingVariant = existingVariants.find(
                (v: { size: string; color: string }) =>
                    v.size === size && v.color === color
            );

            if (existingVariant?.sku) {
                return { sku: existingVariant.sku, alreadyExists: true };
            }

            // Get next sequence number
            const counterDoc = await t.get(counterRef);
            let seq = 1;
            if (counterDoc.exists) {
                seq = (counterDoc.data()?.lastSeq || 0) + 1;
                t.update(counterRef, { lastSeq: seq });
            } else {
                t.set(counterRef, { lastSeq: seq });
            }

            // Get category info from product data
            const useCategoryId = finalCategoryId;
            const useCategoryName = finalCategoryName;

            // Generate professional SKU with size and color
            // Format: RV-{GENDER}-{CATEGORY}-{SIZE}-{COLOR}-{YYYYMM}-{SEQ}
            // Example: RV-K-AS-38-SYH-202602-0001
            const sku = generateSKU({
                categoryId: useCategoryId,
                categoryName: useCategoryName,
                size,
                color,
                sequence: seq,
            });

            // SKU now serves as barcode too, so we don't need separate barcode
            const barcode = sku;

            // Update or add variant with SKU
            const updatedVariants = existingVariants.map((v: { size: string; color: string }) =>
                (v.size === size && v.color === color) ? { ...v, sku, barcode } : v
            );

            // If variant doesn't exist, add it
            if (!existingVariant) {
                updatedVariants.push({ size, color, sku, barcode, qty: 0 });
            }

            t.update(productRef, {
                variants: updatedVariants,
                lastSkuGeneratedAt: new Date(),
            });

            return { sku, barcode, alreadyExists: false };
        });

        return NextResponse.json({
            success: true,
            sku: result.sku,
            barcode: result.barcode,
            message: result.alreadyExists ? "SKU already exists for this variant" : "SKU generated successfully"
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
