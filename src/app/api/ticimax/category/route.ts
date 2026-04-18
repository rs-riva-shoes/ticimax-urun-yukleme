import { env } from '@/config/env';
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const domain = env.TICIMAX_DOMAIN;
        const userCode = env.TICIMAX_USER;
        const password = env.TICIMAX_PASS;

        if (!domain || !userCode || !password) {
            return NextResponse.json({ success: false, error: "API kimlik bilgileri eksik." }, { status: 500 });
        }

        const ticimaxUrl = `${domain}/Servis/UrunServis.svc`;

        const xml = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <SelectKategori xmlns="http://tempuri.org/">
      <UyeKodu>${userCode}</UyeKodu>
      <Sifre>${password}</Sifre>
    </SelectKategori>
  </soap:Body>
</soap:Envelope>`;

        const res = await fetch(ticimaxUrl, {
            method: "POST",
            headers: {
                "Content-Type": "text/xml; charset=utf-8",
                "SOAPAction": "http://tempuri.org/IUrunServis/SelectKategori"
            },
            body: xml,
            cache: 'no-store'
        });

        const text = await res.text();
        const regex = /<a:Kategori[^>]*>([\s\S]*?)<\/a:Kategori>/g;
        let match;
        const categories = [];

        while ((match = regex.exec(text)) !== null) {
            const catXml = match[1];
            const idMatch = catXml.match(/<a:ID>(.*?)<\/a:ID>/);
            const nameMatch = catXml.match(/<a:Tanim>(.*?)<\/a:Tanim>/);
            
            if (idMatch && nameMatch) {
                categories.push({
                    id: idMatch[1],
                    name: nameMatch[1]
                });
            }
        }

        // Alfabetik sırala
        categories.sort((a, b) => a.name.localeCompare(b.name, 'tr-TR'));

        return NextResponse.json({ success: true, categories });
    } catch (error) {
        console.error("Kategori çekme hatası:", error);
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
}
