
import { NextResponse } from 'next/server';

// Yardımcı fonksiyon: XML özel karakterlerini escape et
const escapeXml = (unsafe: string | number | undefined) => {
    if (unsafe === undefined || unsafe === null) return '';
    return String(unsafe)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
};

// Para birimi ID eşleştirmesi
const getCurrencyId = (currencyCode: string): number => {
    const mapping: Record<string, number> = {
        'TL': 1,
        'TRY': 1,
        'USD': 2,
        'EUR': 3,
        'GBP': 4
    };
    return mapping[currencyCode.toUpperCase()] || 1;
};

export async function POST(request: Request) {
    try {
        const payload = await request.json();

        // Çevresel Değişkenler
        const domain = process.env.TICIMAX_DOMAIN || "https://www.siteadi.com"; // Başında https:// olmalı
        const userCode = process.env.TICIMAX_USER;
        const password = process.env.TICIMAX_PASS;

        if (!userCode || !password) {
            return NextResponse.json(
                { success: false, error: "API kimlik bilgileri (.env) eksik! Lütfen TICIMAX_USER ve TICIMAX_PASS tanımlayın." },
                { status: 500 }
            );
        }

        // 1. Loglama (Gelen veriyi kontrol edelim)
        console.log(`[Ticimax Push] İstek alındı. Ürün: ${payload.title}`);

        const variantsWithImages = payload.variants?.filter((v: any) => v.image).length || 0;
        console.log(`[Ticimax Push] Varyant Sayısı: ${payload.variants?.length || 0} (${variantsWithImages} tanesinde özel resim var)`);
        console.log(`[Ticimax Push] Resim Sayısı (Ana): ${payload.images?.length || 0}`);

        // Debug all variants to check structure
        if (payload.variants) {
            console.log(`[Ticimax Push] TOPLAM ${payload.variants.length} VARYANT GELDİ:`);
            payload.variants.forEach((v: any, index: number) => {
                const imgCount = Array.isArray(v.images) ? v.images.length : (v.image ? 1 : 0);
                const debugIndices = v._debugIndices ? JSON.stringify(v._debugIndices) : "N/A";
                console.log(`   - V${index + 1} (${v.color}): ${imgCount} Resim (Indices: ${debugIndices}) | Title: ${v.customTitle || "YOK"}`);
            });
        }

        // 2. Validasyon (Kullanıcı dostu hatalar)
        if (!payload.variants || payload.variants.length === 0) {
            return NextResponse.json(
                { success: false, error: "Lütfen en az bir varyant (beden/renk) ekleyin." },
                { status: 400 }
            );
        }

        if (!payload.images || payload.images.length === 0) {
            return NextResponse.json(
                { success: false, error: "Lütfen en az bir ürün fotoğrafı yükleyin." },
                { status: 400 }
            );
        }

        // SOAP XML Şablonu (SaveUrun)
        // Not: Bu yapı Ticimax'ın standart SaveUrun yapısına göre tahmin edilmiştir.
        // Gerçek WSDL yapısına göre alan adları 'UrunAdi' mi 'UrunBaslik' mı değişebilir.
        // Genelde 'UrunKarti' nesnesi beklenir.

        // Toplam Stok Adedi hesaplama
        const totalQty = payload.variants?.reduce((sum: number, v: any) => sum + (v.qty || 0), 0) || 0;

        // Teknik Detaylar (Attribute) mapping
        let technicalDetailsXml = '';
        if (payload.selectedAttributes && payload.selectedAttributes.length > 0) {
            technicalDetailsXml = `
          <arr:TeknikDetaylar>
            ${payload.selectedAttributes.map((attr: any) => `
              <arr:UrunKartiTeknikDetay>
                <arr:DegerID>${attr.valueId}</arr:DegerID>
                <arr:ID>0</arr:ID>
                <arr:OzellikID>${attr.featureId}</arr:OzellikID>
              </arr:UrunKartiTeknikDetay>
            `).join('')}
          </arr:TeknikDetaylar>`;
        }

        // Para birimi ID'si
        const currencyId = getCurrencyId(payload.price.currency || "TL");

        // Varyasyonlar
        let variantsInnerXml = '';
        if (payload.variants && payload.variants.length > 0) {
            variantsInnerXml = payload.variants.map((v: any) => {
                // Varyant resimleri hazırlığı
                let variantImagesXml = '<arr:Resimler />';
                let activeImages: string[] = [];

                if (Array.isArray(v.images) && v.images.length > 0) {
                    activeImages = v.images;
                } else if (v.image) {
                    activeImages = [v.image];
                }

                if (activeImages.length > 0) {
                    variantImagesXml = `<arr:Resimler xmlns:b="http://schemas.microsoft.com/2003/10/Serialization/Arrays">
                        ${activeImages.map((img: string) => `
                            <b:string>${escapeXml(img)}</b:string>
                        `).join('')}
                     </arr:Resimler>`;
                }

                return `
                    <arr:Varyasyon>
                        <arr:Aktif>true</arr:Aktif>
                        <arr:AlisFiyati>${payload.price.purchase}</arr:AlisFiyati>
                        <arr:Barkod>${escapeXml(v.barcode)}</arr:Barkod>
                        <arr:Desi>${((payload.dimensions?.width * payload.dimensions?.height * payload.dimensions?.depth) / 3000).toFixed(2) || 0.01}</arr:Desi>
                        <arr:ID>0</arr:ID>
                        <arr:KdvDahil>false</arr:KdvDahil>
                        <arr:KdvOrani>10</arr:KdvOrani>
                        <arr:Ozellikler>
                            <arr:VaryasyonOzellik>
                                <arr:Deger>${escapeXml(v.size)}</arr:Deger>
                                <arr:Tanim>Beden</arr:Tanim>
                            </arr:VaryasyonOzellik>
                            <arr:VaryasyonOzellik>
                                <arr:Deger>${escapeXml(v.color)}</arr:Deger>
                                <arr:Tanim>Renk</arr:Tanim>
                            </arr:VaryasyonOzellik>
                        </arr:Ozellikler>
                        <arr:ParaBirimiID>${currencyId}</arr:ParaBirimiID>
                        ${variantImagesXml}
                        <arr:SatisFiyati>${payload.price.sale}</arr:SatisFiyati>
                        <arr:StokAdedi>${v.qty}</arr:StokAdedi>
                        <arr:StokKodu>${escapeXml(payload.productCode)}</arr:StokKodu>
                        <arr:TedarikciKodu>${escapeXml(v.barcode)}</arr:TedarikciKodu>
                        <arr:UrunKartiID>0</arr:UrunKartiID>
                    </arr:Varyasyon>
                `;
            }).join('');
        }
        const variantsXml = `<arr:Varyasyonlar>${variantsInnerXml}</arr:Varyasyonlar>`;

        // Resimler - WSDL ArrayOfstring formatına göre (b:string)
        let imagesXml = '<arr:Resimler />';
        if (payload.images && payload.images.length > 0) {
            imagesXml = `<arr:Resimler xmlns:b="http://schemas.microsoft.com/2003/10/Serialization/Arrays">
                ${payload.images.map((img: string) => `
                    <b:string>${escapeXml(img)}</b:string>
                `).join('')}
             </arr:Resimler>`;
        }

        // Kategori ID Listesi (Hiyerarşik + Ürün Tipi)
        let categoryIdArray = [payload.categoryId || 0];
        if (payload.combinedCategoryIds && Array.isArray(payload.combinedCategoryIds) && payload.combinedCategoryIds.length > 0) {
            categoryIdArray = payload.combinedCategoryIds;
        }

        const soapBody = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:arr="http://schemas.datacontract.org/2004/07/">
  <soap:Body>
    <SaveUrun xmlns="http://tempuri.org/">
      <UyeKodu>${userCode}</UyeKodu>
      <urunKartlari>
        <arr:UrunKarti>
          <arr:Aciklama>${escapeXml(payload.description)}</arr:Aciklama>
          <arr:Aktif>true</arr:Aktif>
          <arr:AnaKategori>${escapeXml(payload.categoryName)}</arr:AnaKategori>
          <arr:AnaKategoriID>${payload.categoryId || 0}</arr:AnaKategoriID>
          <arr:ID>0</arr:ID>
          <arr:Kategoriler xmlns:b="http://schemas.microsoft.com/2003/10/Serialization/Arrays">
            ${categoryIdArray.map((cid: any) => `<b:int>${cid}</b:int>`).join('')}
          </arr:Kategoriler>
          <arr:ListedeGoster>true</arr:ListedeGoster>
          <arr:MarkaID>${payload.brandId || 0}</arr:MarkaID>
          ${imagesXml}
          <arr:SatisBirimi>Adet</arr:SatisBirimi>
          <arr:TedarikciID>${payload.supplierId || 1}</arr:TedarikciID>
          <arr:TedarikciKodu>${escapeXml(payload.productCode)}</arr:TedarikciKodu>
          ${technicalDetailsXml}
          <arr:ToplamStokAdedi>${totalQty}</arr:ToplamStokAdedi>
          <arr:UcretsizKargo>false</arr:UcretsizKargo>
          <arr:UrunAdi>${escapeXml(payload.title)}</arr:UrunAdi>
          <arr:UrunTipi>2</arr:UrunTipi>
          ${variantsXml}
        </arr:UrunKarti>
      </urunKartlari>
      <ukAyar>
        <arr:AktifGuncelle>true</arr:AktifGuncelle>
        <arr:KategoriGuncelle>true</arr:KategoriGuncelle>
        <arr:MarkaGuncelle>true</arr:MarkaGuncelle>
        <arr:TedarikciKodunaGoreGuncelle>true</arr:TedarikciKodunaGoreGuncelle>
        <arr:UrunAdiGuncelle>true</arr:UrunAdiGuncelle>
        <arr:UrunResimGuncelle>true</arr:UrunResimGuncelle>
      </ukAyar>
      <vAyar>
        <arr:AktifGuncelle>true</arr:AktifGuncelle>
        <arr:AlisFiyatiGuncelle>true</arr:AlisFiyatiGuncelle>
        <arr:BarkodGuncelle>true</arr:BarkodGuncelle>
        <arr:SatisFiyatiGuncelle>true</arr:SatisFiyatiGuncelle>
        <arr:StokAdediGuncelle>true</arr:StokAdediGuncelle>
        <arr:TedarikciKodunaGoreGuncelle>true</arr:TedarikciKodunaGoreGuncelle>
      </vAyar>
    </SaveUrun>
  </soap:Body>
</soap:Envelope>`;

        // Dry-run kontrolü
        if (payload.dryRun) {
            return NextResponse.json({
                success: true,
                dryRun: true,
                soapBody,
                message: "Dry-run başarılı. XML üretildi."
            });
        }

        console.log("Gönderilen SOAP İsteği:", soapBody);

        const apiUrl = `${domain.replace(/\/$/, '')}/Servis/UrunServis.svc`;
        console.log(`[Ticimax Push] Hedef URL: ${apiUrl}`);
        console.log(`[Ticimax Push] İstek gönderiliyor... (Zaman: ${new Date().toISOString()})`);

        const startTime = Date.now();
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/xml; charset=utf-8',
                'SOAPAction': 'http://tempuri.org/IUrunServis/SaveUrun'
            },
            body: soapBody
        });
        const duration = Date.now() - startTime;
        console.log(`[Ticimax Push] Yanıt alındı! Süre: ${duration}ms (Zaman: ${new Date().toISOString()})`);

        const responseText = await response.text();
        console.log("Ticimax Yanıtı:", responseText);

        // Hata Kontrolü
        if (!response.ok) {
            return NextResponse.json({
                success: false,
                error: `HTTP Hatası: ${response.status} `,
                details: responseText,
                sentSoapBody: soapBody.substring(0, 5000) // Debug: first 5000 chars
            }, { status: 500 });
        }

        // Basit XML Parse (Başarılı olup olmadığını anlamak için)
        // Genelde <SaveUrunResult> içinde ID veya hata mesajı döner.
        // Başarılıysa pozitif bir ID döner.

        const isSuccess = responseText.includes("SaveUrunResult") && !responseText.includes("<Hata>");

        // Regex ile Result değerini çekmeye çalışalım
        // Regex ile Result değerini çekmeye çalışalım
        const match = responseText.match(/<SaveUrunResult>(.*?)<\/SaveUrunResult>/);
        let resultValue = match ? match[1] : null;

        // EĞER SONUÇ 0 İSE VE İÇERİDE BAŞKA ID VARSA ONU KULLAN (Ticimax bazen 0 dönse de kaydeder)
        if (!resultValue || resultValue === '0' || parseInt(resultValue) === 0) {
            // <a:ID>206</a:ID> veya <ID>206</ID>
            const innerIdMatch = responseText.match(/:ID>(\d+)<\//);
            if (innerIdMatch && parseInt(innerIdMatch[1]) > 0) {
                resultValue = innerIdMatch[1];
                console.log("SaveUrunResult 0 ama geçerli ID bulundu:", resultValue);
            }
        }

        if (parseInt(resultValue || "0") > 0) {
            return NextResponse.json({ success: true, message: "Ürün başarıyla Ticimax'a gönderildi.", ticimaxId: resultValue });
        } else {
            // XML içinden hata mesajını parse etmeye çalışalım
            const errorMatch = responseText.match(/<Message>(.*?)<\/Message>/) || responseText.match(/<Hata>(.*?)<\/Hata>/);
            const errorMessage = errorMatch ? errorMatch[1] : "Bilinmeyen Ticimax hatası";

            return NextResponse.json({ success: false, error: errorMessage, rawResponse: responseText }, { status: 400 });
        }

    } catch (error) {
        console.error("Ticimax Push Error:", error);
        return NextResponse.json(
            { success: false, error: "Sunucu hatası oluştu.", details: String(error) },
            { status: 500 }
        );
    }
}
