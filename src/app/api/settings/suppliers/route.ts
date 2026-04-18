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

// GET: Tedarikçi Listesini Çek (SelectTedarikci)
export async function GET() {
    try {
        const domain = env.TICIMAX_DOMAIN;
        const userCode = env.TICIMAX_USER;

        if (!userCode) {
            console.error("DEBUG: TICIMAX_USER eksik");
            return NextResponse.json({ success: false, error: "API Ayarları eksik" }, { status: 500 });
        }

        const soapBody = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <SelectTedarikci xmlns="http://tempuri.org/">
      <UyeKodu>${userCode}</UyeKodu>
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
        console.log("SelectTedarikci Response:", responseText.substring(0, 1000));

        if (!response.ok) {
            console.error("Ticimax SelectTedarikci Error:", responseText);
            return NextResponse.json({ success: false, error: "Ticimax bağlantı hatası" }, { status: 500 });
        }

        // XML Parse (Regex)
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

        return NextResponse.json(suppliers);

    } catch (error) {
        console.error("Error fetching suppliers:", error);
        return NextResponse.json({ success: false, error: "Tedarikçiler alınamadı" }, { status: 500 });
    }
}

// POST: Yeni Tedarikçi Ekle (SaveTedarikci)
export async function POST(request: Request) {
    try {
        const payload = await request.json();

        if (!payload.name) {
            return NextResponse.json({ success: false, error: "Tedarikçi adı zorunlu" }, { status: 400 });
        }

        const domain = env.TICIMAX_DOMAIN;
        const userCode = env.TICIMAX_USER;

        const soapBody = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <SaveTedarikci xmlns="http://tempuri.org/">
      <UyeKodu>${userCode}</UyeKodu>
      <tedarikci xmlns:q1="http://schemas.datacontract.org/2004/07/">
        <q1:Aktif>true</q1:Aktif>
        <q1:ID>0</q1:ID>
        <q1:Tanim>${escapeXml(payload.name)}</q1:Tanim>
      </tedarikci>
    </SaveTedarikci>
  </soap:Body>
</soap:Envelope>`;

        const apiUrl = `${domain.replace(/\/$/, '')}/Servis/UrunServis.svc`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/xml; charset=utf-8',
                'SOAPAction': 'http://tempuri.org/IUrunServis/SaveTedarikci'
            },
            body: soapBody
        });

        const responseText = await response.text();
        console.log("SaveTedarikci Response:", responseText);

        if (!response.ok) {
            return NextResponse.json({ success: false, error: "Ticimax kayıt hatası", details: responseText }, { status: 500 });
        }

        const resultIdMatch = responseText.match(/<SaveTedarikciResult>(\d+)<\/SaveTedarikciResult>/);
        let newSupplierId = 0;

        if (resultIdMatch && parseInt(resultIdMatch[1]) > 0) {
            newSupplierId = parseInt(resultIdMatch[1]);
        } else {
            const innerIdMatch = responseText.match(/:ID>(\d+)<\//) || responseText.match(/<ID>(\d+)<\/ID>/);
            if (innerIdMatch && parseInt(innerIdMatch[1]) > 0) {
                newSupplierId = parseInt(innerIdMatch[1]);
            }
        }

        if (newSupplierId > 0) {
            return NextResponse.json({
                success: true,
                supplier: { ticimaxId: newSupplierId, name: payload.name }
            });
        } else {
            const errorMatch = responseText.match(/<Message>(.*?)<\/Message>/) || responseText.match(/<Hata>(.*?)<\/Hata>/);
            return NextResponse.json({ success: false, error: errorMatch ? errorMatch[1] : "Bilinmeyen hata (ID dönmedi)" }, { status: 400 });
        }

    } catch (error) {
        console.error("Error adding supplier:", error);
        return NextResponse.json({ success: false, error: "Tedarikçi eklenemedi" }, { status: 500 });
    }
}
