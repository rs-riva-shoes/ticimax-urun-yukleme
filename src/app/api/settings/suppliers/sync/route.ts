import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
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
    <SelectTedarikci xmlns="http://tempuri.org/">
      <UyeKodu>${userCode}</UyeKodu>
      <TedarikciID>0</TedarikciID>
      <KategoriID>0</KategoriID>
    </SelectTedarikci>
  </soap:Body>
</soap:Envelope>`;

        const apiUrl = `${domain.replace(/\/$/, '')}/Servis/UrunServis.svc`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/xml; charset=utf-8',
                'SOAPAction': 'http://tempuri.org/IUrunServis/SelectTedarikci'
            },
            body: soapBody
        });

        const responseText = await response.text();

        if (!response.ok) {
            return NextResponse.json({ success: false, error: "Ticimax bağlantı hatası" }, { status: 500 });
        }

        const suppliers: any[] = [];
        const cleanXml = responseText.replace(/<[a-zA-Z0-9_]+:/g, '<').replace(/<\/[a-zA-Z0-9_]+:/g, '</');
        const supplierRegex = /<Tedarikci>([\s\S]*?)<\/Tedarikci>/g;
        let match;

        while ((match = supplierRegex.exec(cleanXml)) !== null) {
            const block = match[1];
            const idMatch = block.match(/<ID>(\d+)<\/ID>/);
            const nameMatch = block.match(/<Tanim>(.*?)<\/Tanim>/);

            if (idMatch && nameMatch) {
                suppliers.push({
                    ticimaxId: parseInt(idMatch[1]),
                    name: nameMatch[1]
                });
            }
        }

        // Ensure default supplier exists if list is empty or doesn't contain ID 1
        if (!suppliers.some(s => s.ticimaxId === 1)) {
            suppliers.unshift({ ticimaxId: 1, name: 'Varsayılan Tedarikçi' });
        }

        // Store in Firestore
        await adminDb.collection('settings').doc('suppliers').set({
            list: suppliers,
            updatedAt: new Date().toISOString()
        });

        return NextResponse.json({
            success: true,
            count: suppliers.length,
            message: `${suppliers.length} tedarikçi Firebase'e kaydedildi.`
        });

    } catch (error) {
        console.error("Error syncing suppliers:", error);
        return NextResponse.json({ success: false, error: "Tedarikçiler güncellenemedi" }, { status: 500 });
    }
}
