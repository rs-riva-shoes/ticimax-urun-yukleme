import { NextResponse } from 'next/server';
import { env } from '@/config/env';
import { PushPayload, EnrichedVariant } from '@/types';
import { logger, withRetry, handleApiError } from '@/utils/safety';

const escapeXml = (unsafe: string | number | undefined) => {
    if (unsafe === undefined || unsafe === null) return '';
    return String(unsafe)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
};

const getCurrencyId = (currencyCode: string): number => {
    const mapping: Record<string, number> = { 'TL': 1, 'TRY': 1, 'USD': 2, 'EUR': 3, 'GBP': 4 };
    return mapping[currencyCode.toUpperCase()] || 1;
};

export async function POST(request: Request) {
    try {
        const payload: PushPayload = await request.json();
        const domain = env.TICIMAX_DOMAIN;
        const userCode = env.TICIMAX_USER;
        const password = env.TICIMAX_PASS;

        if (!userCode || !password) {
            return NextResponse.json({ success: false, error: "Kimlik bilgileri eksik." }, { status: 500 });
        }

        // --- ÜRÜN ID BELİRLEME ---
        // payload.ticimaxId zaten Firebase'den geliyor (Ticimax'taki gerçek ürün kartı ID'si)
        // Bunu direkt kullanıyoruz — kırık SelectUrun lookup'ına güvenmek yerine.
        const existingId = String(Number(payload.ticimaxId) || 0);
        const mySku = payload.productCode || (payload.variants && payload.variants[0]?.sku) || "";
        
        logger.info('Ticimax Push Started', { productCode: payload.productCode, title: payload.title });
        logger.info('ticimaxId Status', { payloadId: payload.ticimaxId, existingId });

        const taxRate = Number(payload.price.tax) || 10;
        const currencyId = getCurrencyId(payload.price.currency || "TL");

        // Kategoriler (zorunlu alan)
        let cats = [Number(payload.categoryId) || 0];
        if (payload.combinedCategoryIds && Array.isArray(payload.combinedCategoryIds)) {
            cats = payload.combinedCategoryIds.map(Number);
        }

        const soapBody = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <soap:Body>
    <SaveUrun xmlns="http://tempuri.org/">
      <UyeKodu>${userCode}</UyeKodu>
      <urunKartlari xmlns:a="http://schemas.datacontract.org/2004/07/" xmlns:i="http://www.w3.org/2001/XMLSchema-instance">
        <a:UrunKarti>
          <a:Aciklama>${escapeXml(payload.description || payload.title)}</a:Aciklama>
          <a:Aktif>true</a:Aktif>
          <a:AnaKategoriID>${Number(payload.categoryId) || 0}</a:AnaKategoriID>
          <a:ID>${existingId}</a:ID>
          <a:Kategoriler xmlns:b="http://schemas.microsoft.com/2003/10/Serialization/Arrays">
            ${cats.map(c => `<b:int>${c}</b:int>`).join('')}
          </a:Kategoriler>
          <a:MarkaID>16</a:MarkaID>
          <a:Resimler xmlns:b="http://schemas.microsoft.com/2003/10/Serialization/Arrays">
            ${(payload.images || []).map((img: string) => `<b:string>${escapeXml(img)}</b:string>`).join('')}
          </a:Resimler>
          <a:SatisBirimi>Adet</a:SatisBirimi>
          <a:TedarikciID>1</a:TedarikciID>
          <a:TedarikciKodu>${escapeXml(mySku)}</a:TedarikciKodu>
          <a:UrunAdi>${escapeXml(payload.title)}</a:UrunAdi>
          <a:Varyasyonlar>
            ${payload.variants.map((v: EnrichedVariant) => {
                const vBarcode = v.barcode || v.sku || mySku;
                // Varyant resimlerini belirle: v.images dizisi veya v.image string
                let variantImages: string[] = [];
                if (v.images && v.images.length > 0) {
                    variantImages = v.images;
                } else if (v.image) {
                    variantImages = [v.image as string];
                }
                const variantResimlerXml = variantImages.length > 0
                    ? `<a:Resimler xmlns:b="http://schemas.microsoft.com/2003/10/Serialization/Arrays">
                ${variantImages.map((img: string) => `<b:string>${escapeXml(img)}</b:string>`).join('')}
              </a:Resimler>`
                    : '';
                return `<a:Varyasyon>
              <a:Aktif>true</a:Aktif>
              <a:Barkod>${escapeXml(vBarcode)}</a:Barkod>
              <a:KdvOrani>${taxRate}</a:KdvOrani>
              <a:Ozellikler>
                <a:VaryasyonOzellik>
                  <a:Deger>${escapeXml(v.size || 'Standart')}</a:Deger>
                  <a:Tanim>Beden</a:Tanim>
                </a:VaryasyonOzellik>
                <a:VaryasyonOzellik>
                  <a:Deger>${escapeXml(v.color || 'Standart')}</a:Deger>
                  <a:Tanim>Renk</a:Tanim>
                </a:VaryasyonOzellik>
              </a:Ozellikler>
              <a:ParaBirimiID>${currencyId}</a:ParaBirimiID>
              ${variantResimlerXml}
              <a:SatisFiyati>${Number(payload.price?.sale) || 0}</a:SatisFiyati>
              <a:StokAdedi>${Number(v.qty) || 0}</a:StokAdedi>
              <a:StokKodu>${escapeXml(mySku)}</a:StokKodu>
              <a:TedarikciKodu>${escapeXml(vBarcode)}</a:TedarikciKodu>
              <a:UrunKartiAktif>true</a:UrunKartiAktif>
              <a:UrunKartiID>${existingId}</a:UrunKartiID>
            </a:Varyasyon>`;
            }).join('')}
          </a:Varyasyonlar>
        </a:UrunKarti>
      </urunKartlari>
      <ukAyar xmlns:a="http://schemas.datacontract.org/2004/07/">
        <a:AktifGuncelle>true</a:AktifGuncelle>
        <a:KategoriGuncelle>true</a:KategoriGuncelle>
        <a:MarkaGuncelle>true</a:MarkaGuncelle>
        <a:UrunAdiGuncelle>true</a:UrunAdiGuncelle>
        <a:UrunResimGuncelle>true</a:UrunResimGuncelle>
      </ukAyar>
      <vAyar xmlns:a="http://schemas.datacontract.org/2004/07/">
        <a:AktifGuncelle>true</a:AktifGuncelle>
        <a:StokAdediGuncelle>true</a:StokAdediGuncelle>
        <a:SatisFiyatiGuncelle>true</a:SatisFiyatiGuncelle>
        <a:VaryasyonOzellikGuncelle>true</a:VaryasyonOzellikGuncelle>
      </vAyar>
    </SaveUrun>
  </soap:Body>
</soap:Envelope>`;

        logger.info('SOAP Payload Generated', { id: existingId, variants: payload.variants.length });

        const apiUrl = `${domain.replace(/\/$/, '')}/Servis/UrunServis.svc`;
        
        const responseText = await withRetry(async () => {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'text/xml; charset=utf-8', 
                    'SOAPAction': 'http://tempuri.org/IUrunServis/SaveUrun' 
                },
                body: soapBody
            });

            if (!response.ok) {
                throw new Error(`Ticimax HTTP Error: ${response.status} ${response.statusText}`);
            }

            return await response.text();
        }, { maxRetries: 3, delay: 1000 });

        logger.info("Ticimax Response Received", { length: responseText.length });

        // Hata kontrolü
        if (responseText.includes('<s:Fault>')) {
            const msgMatch = responseText.match(/<faultstring[^>]*>(.*?)<\/faultstring>/);
            return NextResponse.json({ 
                success: false, 
                error: msgMatch ? msgMatch[1] : "SOAP Fault", 
                details: responseText.substring(0, 2000) 
            }, { status: 400 });
        }

        const matchSave = responseText.match(/<SaveUrunResult>(.*?)<\/SaveUrunResult>/);
        let resultValue = matchSave ? matchSave[1] : '0';

        if (resultValue === '0') {
            const innerIdMatch = responseText.match(/:ID>(\d+)<\//);
            if (innerIdMatch && parseInt(innerIdMatch[1]) > 0) {
                resultValue = innerIdMatch[1];
            }
        }

        if (parseInt(resultValue) > 0) {
            logger.info('Ticimax Push Successful', { ticimaxId: resultValue });
            return NextResponse.json({ success: true, ticimaxId: resultValue });
        } else {
            const errorMatch = responseText.match(/<Error>(.*?)<\/Error>/) || responseText.match(/<Message>(.*?)<\/Message>/);
            const errorMsg = errorMatch ? errorMatch[1] : "Kaydedilemedi";
            logger.error('Ticimax Push Failed', { resultValue, errorMsg });
            return NextResponse.json({ success: false, error: errorMsg, details: responseText.substring(0, 2000) }, { status: 400 });
        }

    } catch (error) {
        return handleApiError(error);
    }
}
