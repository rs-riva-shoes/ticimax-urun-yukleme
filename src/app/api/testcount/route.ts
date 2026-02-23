import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

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
    <SelectUrunCount xmlns="http://tempuri.org/">
      <UyeKodu>${userCode}</UyeKodu>
      <f>
        <Aktif>-1</Aktif>
      </f>
    </SelectUrunCount>
  </soap:Body>
</soap:Envelope>`;

        const apiUrl = `${domain.replace(/\/$/, '')}/Servis/UrunServis.svc`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/xml; charset=utf-8',
                'SOAPAction': 'http://tempuri.org/IUrunServis/SelectUrunCount'
            },
            body: soapBody
        });

        const responseText = await response.text();
        const match = responseText.match(/<SelectUrunCountResult>(\d+)<\/SelectUrunCountResult>/);
        return NextResponse.json({ success: true, count: match ? match[1] : responseText.substring(0, 500) });
    } catch (error) {
        console.error("Error checking count:", error);
        return NextResponse.json({ success: false, error: "Ürünler güncellenemedi: " + (error as Error).message }, { status: 500 });
    }
}
