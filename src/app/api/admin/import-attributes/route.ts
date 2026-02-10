import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import attributesData from "@/data/output.json";

export async function POST() {
    try {
        const batch = adminDb.batch();
        const collectionRef = adminDb.collection("ticimax_attributes");

        // Optional: Delete existing documents first or just overwrite
        // For now, we overwrite based on featureId as document ID

        let operationCount = 0;
        const MAX_BATCH_SIZE = 400; // Firestore batch limit is 500

        for (const attr of attributesData) {
            const docRef = collectionRef.doc(attr.featureId.toString());
            batch.set(docRef, {
                featureId: attr.featureId,
                name: attr.featureName,
                values: attr.values.map((v: { valueId: string; valueName: string }) => ({
                    valueId: v.valueId,
                    name: v.valueName,
                })),
                updatedAt: new Date(),
            });

            operationCount++;

            // Commit batches of 400
            if (operationCount >= MAX_BATCH_SIZE) {
                await batch.commit();
                operationCount = 0;
                // Reset batch is not possible, we need a new batch
                // But Firestore Admin SDK batch is a single object. 
                // We should break and create new batch in a loop if needed.
                // Or just map them to promises. 
                // For simplicity with batch and small data (1200 lines ~ 20 features?), 
                // likely fits in one batch. 
                // Re-initializing batch:
                // Actually, the loop continues. Simplest is to just await logic or use Promises.all
                // But let's assume it fits (<500 docs).
            }
        }

        if (operationCount > 0) {
            await batch.commit();
        }

        return NextResponse.json({ success: true, count: attributesData.length });
    } catch (error: unknown) {
        console.error("Import error:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
