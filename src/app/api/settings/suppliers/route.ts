
import { NextResponse } from 'next/server';

// Yardımcı: XML Karakter Temizleme
const escapeXml = (unsafe: string | number | undefined) => {
    if (unsafe === undefined || unsafe === null) return '';
    return String(unsafe)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
};

// Yardımcı: XML'den Değer Çekme (Regex ile basit parse)
const extractValue = (xml: string, tag: string) => {
    const regex = new RegExp(`<${tag}>(.*?)<\/${tag}>`);
    const match = xml.match(regex);
    return match ? match[1] : null;
};

// Yardımcı: XML'den Liste Çekme (Namespace Temizleyerek)
const extractSuppliersFromXml = (xml: string) => {
    const suppliers: any[] = [];

    // 1. Tüm Namespace prefixlerini temizle (<a:Tanim> -> <Tanim>)
    const cleanXml = xml.replace(/<[a-zA-Z0-9_]+:/g, '<').replace(/<\/[a-zA-Z0-9_]+:/g, '</');

    // 2. <Tedarikci> bloklarını bul
    const supplierRegex = /<Tedarikci>([\s\S]*?)<\/Tedarikci>/g;
    let match;

    let safety = 0;
    while ((match = supplierRegex.exec(cleanXml)) !== null && safety < 1000) {
        safety++;
        const content = match[1];

        const idMatch = content.match(/<ID>(\d+)<\/ID>/);
        const nameMatch = content.match(/<Tanim>(.*?)<\/Tanim>/);

        if (idMatch && nameMatch) {
            suppliers.push({
                ticimaxId: parseInt(idMatch[1]),
                name: nameMatch[1]
            });
        }
    }
    return suppliers;
};

export async function GET() {
    try {
        const domain = process.env.TICIMAX_DOMAIN || "https://www.siteadi.com";
        const userCode = process.env.TICIMAX_USER;
        console.log("DEBUG: Kullanılan Ticimax UyeKodu:", userCode); // Hangi kodun gittiğini görelim

        if (!userCode) {
            return NextResponse.json({ success: false, error: "API Ayarları eksik" }, { status: 500 });
        }

        // SOAP Body: SelectTedarikci
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
        console.log("SelectTedarikci Response:", responseText.substring(0, 500)); // Debug için ilk 500 karakter

        if (!response.ok) {
            console.error("Ticimax SelectTedarikci Error:", responseText);
            return NextResponse.json({ success: false, error: "Ticimax'tan tedarikçiler çekilemedi." }, { status: 500 });
        }

        const suppliers = extractSuppliersFromXml(responseText);

        // Varsayılan tedarikçi kontrolü (Listede yoksa ekle)
        if (!suppliers.find(s => s.ticimaxId === 1)) {
            suppliers.unshift({ ticimaxId: 1, name: 'Varsayılan Tedarikçi (ID: 1)' });
        }

        return NextResponse.json({ success: true, suppliers });

    } catch (error) {
        console.error("Error fetching suppliers:", error);
        return NextResponse.json({ success: false, error: "Sunucu hatası" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const payload = await request.json();

        if (!payload.name) {
            return NextResponse.json({ success: false, error: "Tedarikçi adı zorunlu" }, { status: 400 });
        }

        const domain = process.env.TICIMAX_DOMAIN || "https://www.siteadi.com";
        const userCode = process.env.TICIMAX_USER;

        // SOAP Body: SaveTedarikci
        // Standart WCF Yapısı: m parametresi ve içindeki Ticimax.BL tipleri
        const soapBody = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <SaveTedarikci xmlns="http://tempuri.org/">
      <UyeKodu>${userCode}</UyeKodu>
      <tedarikci xmlns:q1="http://schemas.datacontract.org/2004/07/">
        <q1:Aktif>true</q1:Aktif>
        <q1:ID>0</q1:ID>
        <q1:Mail>${escapeXml(payload.email || "")}</q1:Mail>
        <q1:Not></q1:Not>
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

        // Yanıttan yeni ID'yi çekmemiz lazım.
        // Genelde <SaveTedarikciResult>ID</SaveTedarikciResult> döner.
        const resultIdMatch = responseText.match(/<SaveTedarikciResult>(\d+)<\/SaveTedarikciResult>/);

        if (resultIdMatch && parseInt(resultIdMatch[1]) > 0) {
            const newId = parseInt(resultIdMatch[1]);
            return NextResponse.json({
                success: true,
                supplier: { ticimaxId: newId, name: payload.name }
            });
        } else {
            // Hata mesajı ara
            const errorMatch = responseText.match(/<Message>(.*?)<\/Message>/) || responseText.match(/<Hata>(.*?)<\/Hata>/);
            return NextResponse.json({ success: false, error: errorMatch ? errorMatch[1] : "Bilinmeyen hata (ID dönmedi)" }, { status: 400 });
        }

    } catch (error) {
        console.error("Error adding supplier:", error);
        return NextResponse.json({ success: false, error: "Tedarikçi eklenemedi" }, { status: 500 });
    }
}
