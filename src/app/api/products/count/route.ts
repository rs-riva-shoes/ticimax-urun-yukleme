import { NextResponse } from 'next/server';
import { adminDb } from '@/services/firebase-admin';

export const revalidate = 0;

export async function GET() {
    try {
        const snapshot = await adminDb.collection("products").count().get();
        return NextResponse.json({ success: true, count: snapshot.data().count });
    } catch (error) {
        console.error("Error fetching product count:", error);
        return NextResponse.json({ success: false, count: 0 }, { status: 500 });
    }
}
