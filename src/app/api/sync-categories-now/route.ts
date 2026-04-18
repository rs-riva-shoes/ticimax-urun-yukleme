import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { adminDb } from "@/lib/firebase-admin";

export async function GET() {
    const ticimaxUrl = `${process.env.TICIMAX_DOMAIN}/Servis/UrunServis.svc`;
    const userCode = process.env.TICIMAX_USER;
    const password = process.env.TICIMAX_PASS;

    if (!ticimaxUrl || !userCode || !password) {
        return NextResponse.json({ error: "Ticimax auth eksik!" }, { status: 500 });
    }

    const xml = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <SelectUrun xmlns="http://tempuri.org/">
      <UyeKodu>${userCode}</UyeKodu>
      <Sifre>${password}</Sifre>
      <f xsi:type="q1:UrunFiltre" xmlns:q1="http://schemas.datacontract.org/2004/07/Ticimax.Modeller">
        <q1:Aktif>-1</q1:Aktif>
      </f>
    </SelectUrun>
  </soap:Body>
</soap:Envelope>`;

    try {
        const response = await fetch(ticimaxUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/xml; charset=utf-8',
                'SOAPAction': 'http://tempuri.org/IUrunServis/SelectUrun'
            },
            body: xml
        });

        const text = await response.text();
        
        const regex = /<a:UrunKarti[^>]*>([\s\S]*?)<\/a:UrunKarti>/g;
        let match;
        const productsMap = new Map();
        
        let matchCount = 0;
        while ((match = regex.exec(text)) !== null) {
            matchCount++;
            const productXml = match[1];
            
            const skuMatch = productXml.match(/<a:TedarikciKodu>(.*?)<\/a:TedarikciKodu>/);
            const sku = skuMatch ? skuMatch[1] : null;
            
            const catMatch = productXml.match(/<a:AnaKategoriID>(.*?)<\/a:AnaKategoriID>/);
            const catId = catMatch ? parseInt(catMatch[1]) : 0;
            
            const catNameMatch = productXml.match(/<a:AnaKategori>(.*?)<\/a:AnaKategori>/);
            const catName = catNameMatch ? catNameMatch[1] : "";

            if (sku && catId > 0) {
                productsMap.set(sku, { categoryId: catId, categoryName: catName });
            }
        }

        if (productsMap.size === 0) {
            return NextResponse.json({ error: "Eşleşecek kategori bulunamadı.", xml: text.substring(0, 500) });
        }

        const productsRef = adminDb.collection('products');
        const snapshot = await productsRef.get();
        
        let updatedCount = 0;
        const batch = adminDb.batch();

        snapshot.docs.forEach((doc) => {
            const data = doc.data();
            const sku = data.productCode || data.sku || data.barcode;
            
            if (sku && productsMap.has(sku)) {
                const mapped = productsMap.get(sku);
                if (!data.categoryId || parseInt(data.categoryId) !== mapped.categoryId) {
                    batch.update(doc.ref, {
                        categoryId: mapped.categoryId.toString(),
                        categoryName: mapped.categoryName
                    });
                    updatedCount++;
                }
            }
        });

        if (updatedCount > 0) {
            await batch.commit();
        }

        return NextResponse.json({
            success: true,
            totalProcessed: matchCount,
            mappedSkus: productsMap.size,
            updatedFirebaseProducts: updatedCount
        });

    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
}
