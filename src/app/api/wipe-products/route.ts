import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const snapshot = await adminDb.collection("products").get();
        let count = 0;
        const batch = adminDb.batch();
        snapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
            count++;
        });
        if (count > 0) {
            await batch.commit();
        }
        return NextResponse.json({ success: true, count });
    } catch (error) {
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
}
