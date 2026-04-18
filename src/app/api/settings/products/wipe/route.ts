import { NextResponse } from 'next/server';
import { adminDb } from '@/services/firebase-admin';

export async function POST() {
    try {
        const snapshot = await adminDb.collection("products").get();
        let count = 0;
        let batch = adminDb.batch();

        for (const doc of snapshot.docs) {
            batch.delete(doc.ref);
            count++;

            if (count % 450 === 0) {
                await batch.commit();
                batch = adminDb.batch();
            }
        }

        if (count % 450 !== 0) {
            await batch.commit();
        }

        return NextResponse.json({
            success: true,
            count,
            message: `${count} ürün Firebase'den silindi.`
        });
    } catch (error) {
        console.error("Wipe Error:", error);
        return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
    }
}
