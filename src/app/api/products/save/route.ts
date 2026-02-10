import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { id, ...data } = body;

        // Clean up undefined fields to avoid Firestore errors
        const cleanData = JSON.parse(JSON.stringify(data));

        let productId = id;

        if (productId) {
            // Update existing product
            await adminDb.collection("products").doc(productId).set(cleanData, { merge: true });
        } else {
            // Create new product
            const docRef = await adminDb.collection("products").add(cleanData);
            productId = docRef.id;
        }

        return NextResponse.json({
            success: true,
            productId,
            message: id ? "Product updated successfully" : "Product created successfully"
        });

    } catch (error: unknown) {
        console.error("Save Product Error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}
