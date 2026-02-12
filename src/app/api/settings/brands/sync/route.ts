import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import fs from 'fs';
import path from 'path';

export async function POST() {
    try {
        const domain = process.env.TICIMAX_DOMAIN || "https://www.siteadi.com";
        const userCode = process.env.TICIMAX_USER;

        if (!userCode) {
            return NextResponse.json({ success: false, error: "API Ayarları eksik" }, { status: 500 });
        }

        const soapBody = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <SelectMarka xmlns="http://tempuri.org/">
      <UyeKodu>${userCode}</UyeKodu>
      <MarkaID>0</MarkaID>
      <KategoriID>0</KategoriID>
    </SelectMarka>
  </soap:Body>
</soap:Envelope>`;

        const apiUrl = `${domain.replace(/\/$/, '')}/Servis/UrunServis.svc`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/xml; charset=utf-8',
                'SOAPAction': 'http://tempuri.org/IUrunServis/SelectMarka'
            },
            body: soapBody
        });

        const responseText = await response.text();

        if (!response.ok) {
            return NextResponse.json({ success: false, error: "Ticimax bağlantı hatası" }, { status: 500 });
        }

        const brands: any[] = [];
        const cleanXml = responseText.replace(/<[a-zA-Z0-9_]+:/g, '<').replace(/<\/[a-zA-Z0-9_]+:/g, '</');
        const brandRegex = /<Marka>([\s\S]*?)<\/Marka>/g;
        let match;

        while ((match = brandRegex.exec(cleanXml)) !== null) {
            const brandBlock = match[1];
            const idMatch = brandBlock.match(/<ID>(\d+)<\/ID>/);
            const nameMatch = brandBlock.match(/<Tanim>(.*?)<\/Tanim>/);

            if (idMatch && nameMatch) {
                brands.push({
                    ticimaxId: parseInt(idMatch[1]),
                    name: nameMatch[1]
                });
            }
        }

        // Write to Firestore (Sync logic)
        // Storing as a single document 'brands' in 'settings' collection for simpler fetching
        const docRef = adminDb.collection('settings').doc('brands');
        await docRef.set({
            list: brands,
            updatedAt: new Date().toISOString()
        });

        // Also update local file as fallback/cache if needed? No, user wants Firebase.
        // But for development speed, let's keep local just in case? No, remove to avoid confusion.

        return NextResponse.json({
            success: true,
            count: brands.length,
            message: `${brands.length} marka Firebase'e kaydedildi.`
        });

    } catch (error) {
        console.error("Error syncing brands:", error);
        return NextResponse.json({ success: false, error: "Markalar güncellenemedi" }, { status: 500 });
    }
}
