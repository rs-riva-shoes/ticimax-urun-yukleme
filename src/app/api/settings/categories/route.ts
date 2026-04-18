import { NextResponse } from 'next/server';
import { adminDb } from '@/services/firebase-admin';

export async function GET() {
    try {
        const doc = await adminDb.collection('settings').doc('categories').get();
        
        if (!doc.exists) {
            return NextResponse.json({ success: true, list: [] });
        }

        const data = doc.data();
        return NextResponse.json({ 
            success: true, 
            list: data?.list || [],
            updatedAt: data?.updatedAt
        });
    } catch (error) {
        console.error("Error fetching categories:", error);
        return NextResponse.json({ success: false, error: "Kategoriler yüklenemedi" }, { status: 500 });
    }
}
