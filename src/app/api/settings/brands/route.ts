import { env } from '@/config/env';
import { NextResponse } from 'next/server';

function escapeXml(unsafe: string): string {
    return unsafe.replace(/[<>&'"]/g, function (c) {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
            default: return c;
        }
    });
}

// GET: Marka Listesini Çek (SelectMarka)
export async function GET() {
    try {
        const domain = env.TICIMAX_DOMAIN;
        const userCode = env.TICIMAX_USER;

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
        console.log("SelectMarka Raw Response:", responseText.substring(0, 1000));

        if (!response.ok) {
            console.error("SelectMarka Error:", responseText);
            return NextResponse.json({ success: false, error: "Ticimax bağlantı hatası" }, { status: 500 });
        }

        const brands: any[] = [];
        const cleanXml = responseText.replace(/<[a-zA-Z0-9_]+:/g, '<').replace(/<\/[a-zA-Z0-9_]+:/g, '</');
        const brandRegex = /<Marka>([\s\S]*?)<\/Marka>/g;
        let match;
        let safety = 0;

        while ((match = brandRegex.exec(cleanXml)) !== null && safety < 2000) {
            safety++;
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

        return NextResponse.json({ success: true, brands });

    } catch (error) {
        console.error("Error fetching brands:", error);
        return NextResponse.json({ success: false, error: "Markalar alınamadı" }, { status: 500 });
    }
}

// POST: Yeni Marka Ekle (SaveMarka)
export async function POST(request: Request) {
    try {
        const payload = await request.json();

        if (!payload.name) {
            return NextResponse.json({ success: false, error: "Marka adı zorunlu" }, { status: 400 });
        }

        const domain = env.TICIMAX_DOMAIN;
        const userCode = env.TICIMAX_USER;

        const soapBody = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <SaveMarka xmlns="http://tempuri.org/">
      <UyeKodu>${userCode}</UyeKodu>
      <marka xmlns:q1="http://schemas.datacontract.org/2004/07/">
        <q1:Aktif>true</q1:Aktif>
        <q1:ID>0</q1:ID>
        <q1:Tanim>${escapeXml(payload.name)}</q1:Tanim>
      </marka>
    </SaveMarka>
  </soap:Body>
</soap:Envelope>`;

        const apiUrl = `${domain.replace(/\/$/, '')}/Servis/UrunServis.svc`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/xml; charset=utf-8',
                'SOAPAction': 'http://tempuri.org/IUrunServis/SaveMarka'
            },
            body: soapBody
        });

        const responseText = await response.text();
        console.log("SaveMarka Response:", responseText);

        if (!response.ok) {
            return NextResponse.json({ success: false, error: "Ticimax kayıt hatası", details: responseText }, { status: 500 });
        }

        const resultIdMatch = responseText.match(/<SaveMarkaResult>(\d+)<\/SaveMarkaResult>/);
        let newBrandId = 0;

        if (resultIdMatch && parseInt(resultIdMatch[1]) > 0) {
            newBrandId = parseInt(resultIdMatch[1]);
        } else {
            const innerIdMatch = responseText.match(/:ID>(\d+)<\//) || responseText.match(/<ID>(\d+)<\/ID>/);
            if (innerIdMatch && parseInt(innerIdMatch[1]) > 0) {
                newBrandId = parseInt(innerIdMatch[1]);
            }
        }

        if (newBrandId > 0) {
            return NextResponse.json({
                success: true,
                brand: { ticimaxId: newBrandId, name: payload.name }
            });
        } else {
            const errorMatch = responseText.match(/<Message>(.*?)<\/Message>/) || responseText.match(/<Hata>(.*?)<\/Hata>/);
            return NextResponse.json({ success: false, error: errorMatch ? errorMatch[1] : "Bilinmeyen hata (ID dönmedi)" }, { status: 400 });
        }

    } catch (error) {
        console.error("Error adding brand:", error);
        return NextResponse.json({ success: false, error: "Marka eklenemedi" }, { status: 500 });
    }
}
