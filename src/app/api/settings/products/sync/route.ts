import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

function slugToTitle(url: string) {
    if (!url) return "";
    try {
        const parts = url.split('/');
        const fileName = parts[parts.length - 1];
        const nameWithoutExt = fileName.split('.')[0];
        const slugParts = nameWithoutExt.split('-');

        if (slugParts.length > 1) {
            const lastPart = slugParts[slugParts.length - 1];
            if (lastPart.length <= 8 && (/^[a-f0-9]+$/i.test(lastPart) || /^\d+$/.test(lastPart))) {
                slugParts.pop();
            }
        }

        if (slugParts.length > 1) {
            const lastPart = slugParts[slugParts.length - 1];
            if (/^\d+$/.test(lastPart)) {
                slugParts.pop();
            }
        }

        return slugParts
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    } catch (e) {
        return "";
    }
}

async function ticimaxSoapCall(domain: string, action: string, body: string) {
    const soapEnv = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>${body}</soap:Body>
</soap:Envelope>`;

    const apiUrl = `${domain.replace(/\/$/, '')}/Servis/UrunServis.svc`;
    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/xml; charset=utf-8',
            'SOAPAction': `http://tempuri.org/IUrunServis/${action}`
        },
        body: soapEnv
    });
    return await response.text();
}

export async function POST() {
    try {
        const domain = process.env.TICIMAX_DOMAIN || "https://www.siteadi.com";
        const userCode = process.env.TICIMAX_USER;

        if (!userCode) {
            return NextResponse.json({ success: false, error: "API Ayarları eksik" }, { status: 500 });
        }

        // 1. Fetch Metadata (Brands and Categories)
        const brandsXml = await ticimaxSoapCall(domain, "SelectMarka", `<SelectMarka xmlns='http://tempuri.org/'><UyeKodu>${userCode}</UyeKodu></SelectMarka>`);
        const catsXml = await ticimaxSoapCall(domain, "SelectKategori", `<SelectKategori xmlns='http://tempuri.org/'><UyeKodu>${userCode}</UyeKodu></SelectKategori>`);

        const brandMap = new Map<number, string>();
        const cleanBrands = brandsXml.replace(/<[a-zA-Z0-9_]+:/g, '<').replace(/<\/[a-zA-Z0-9_]+:/g, '</');
        const brandRegex = /<Marka>([\s\S]*?)<\/Marka>/g;
        let bMatch;
        while ((bMatch = brandRegex.exec(cleanBrands)) !== null) {
            const id = parseInt(bMatch[1].match(/<ID>(\d+)<\/ID>/)?.[1] || "0");
            const name = bMatch[1].match(/<Tanim>(.*?)<\/Tanim>/)?.[1] || "";
            if (id) brandMap.set(id, name);
        }

        const catMap = new Map<number, string>();
        const cleanCats = catsXml.replace(/<[a-zA-Z0-9_]+:/g, '<').replace(/<\/[a-zA-Z0-9_]+:/g, '</');
        const catRegex = /<Kategori>([\s\S]*?)<\/Kategori>/g;
        let cMatch;
        while ((cMatch = catRegex.exec(cleanCats)) !== null) {
            const id = parseInt(cMatch[1].match(/<ID>(\d+)<\/ID>/)?.[1] || "0");
            const name = cMatch[1].match(/<Tanim>(.*?)<\/Tanim>/)?.[1] || "";
            if (id) catMap.set(id, name);
        }

        // 2. Fetch Variations
        const variationsXml = await ticimaxSoapCall(domain, "SelectVaryasyon", `
            <SelectVaryasyon xmlns="http://tempuri.org/">
                <UyeKodu>${userCode}</UyeKodu>
                <f><Aktif xmlns="http://schemas.datacontract.org/2004/07/">-1</Aktif></f>
                <s>
                    <BaslangicIndex xmlns="http://schemas.datacontract.org/2004/07/">0</BaslangicIndex>
                    <KayitSayisi xmlns="http://schemas.datacontract.org/2004/07/">5000</KayitSayisi>
                </s>
            </SelectVaryasyon>`);

        const cleanVar = variationsXml.replace(/<[a-zA-Z0-9_]+:/g, '<').replace(/<\/[a-zA-Z0-9_]+:/g, '</');
        const varRegex = /<Varyasyon>([\s\S]*?)<\/Varyasyon>/g;

        const productsMap = new Map<number, any>();
        let vMatch;
        while ((vMatch = varRegex.exec(cleanVar)) !== null) {
            const block = vMatch[1];
            const cardIdMatch = block.match(/<UrunKartiID>(\d+)<\/UrunKartiID>/);
            if (!cardIdMatch) continue;
            const cid = parseInt(cardIdMatch[1]);

            const id = parseInt(block.match(/<ID>(\d+)<\/ID>/)?.[1] || "0");
            const sku = block.match(/<StokKodu>(.*?)<\/StokKodu>/)?.[1] || "";
            const barcode = block.match(/<Barkod>(.*?)<\/Barkod>/)?.[1] || "";
            const salePrice = parseFloat(block.match(/<SatisFiyati>(.*?)<\/SatisFiyati>/)?.[1] || "0");
            const buyingPrice = parseFloat(block.match(/<AlisFiyati>(.*?)<\/AlisFiyati>/)?.[1] || "0");
            const stock = parseFloat(block.match(/<StokAdedi>(.*?)<\/StokAdedi>/)?.[1] || "0");
            const active = block.match(/<Aktif>(true|false)<\/Aktif>/)?.[1] === 'true';
            const brandId = parseInt(block.match(/<MarkaID>(\d+)<\/MarkaID>/)?.[1] || "0");

            // Extract Category IDs
            const vCatIds: number[] = [];
            const catBlock = block.match(/<Kategoriler[\s\S]*?>([\s\S]*?)<\/Kategoriler>/)?.[1] || "";
            const catIdRegex = /<int>(\d+)<\/int>/g;
            let catMatch;
            while ((catMatch = catIdRegex.exec(catBlock)) !== null) {
                vCatIds.push(parseInt(catMatch[1]));
            }

            const images: string[] = [];
            const imgBlock = block.match(/<Resimler[\s\S]*?>([\s\S]*?)<\/Resimler>/)?.[1] || "";
            const imgRegex = /<string>(.*?)<\/string>/g;
            let imgM;
            while ((imgM = imgRegex.exec(imgBlock)) !== null) {
                images.push(imgM[1]);
            }

            const options: any[] = [];
            const optBlock = block.match(/<Ozellikler[\s\S]*?>([\s\S]*?)<\/Ozellikler>/)?.[1] || "";
            const optRegex = /<VaryasyonOzellik>([\s\S]*?)<\/VaryasyonOzellik>/g;
            let oM;
            while ((oM = optRegex.exec(optBlock)) !== null) {
                options.push({
                    type: oM[1].match(/<Tanim>(.*?)<\/Tanim>/)?.[1] || "",
                    value: oM[1].match(/<Deger>(.*?)<\/Deger>/)?.[1] || ""
                });
            }

            const variant = { id, sku, barcode, price: salePrice, buyingPrice, stock, active, options, images };

            if (!productsMap.has(cid)) {
                productsMap.set(cid, {
                    ticimaxId: cid,
                    title: sku,
                    images: images,
                    price: { sale: salePrice, buying: buyingPrice },
                    status: active ? 'published' : 'draft',
                    brandId: brandId,
                    brandName: brandMap.get(brandId) || "",
                    categoryIds: vCatIds,
                    categoryName: vCatIds.length > 0 ? (catMap.get(vCatIds[0]) || "") : "",
                    variants: [variant],
                    _meta: { totalStock: stock },
                    importedAt: new Date().toISOString()
                });
            } else {
                const p = productsMap.get(cid);
                p.variants.push(variant);
                p._meta.totalStock += stock;
                if (salePrice > 0 && (p.price.sale === 0 || salePrice < p.price.sale)) {
                    p.price.sale = salePrice;
                    p.price.buying = buyingPrice;
                }
                images.forEach(img => { if (!p.images.includes(img)) p.images.push(img); });
                vCatIds.forEach(cat => { if (!p.categoryIds.includes(cat)) p.categoryIds.push(cat); });
                if (!p.categoryName && p.categoryIds.length > 0) {
                    p.categoryName = catMap.get(p.categoryIds[0]) || "";
                }
            }
        }

        // Guess Title from Image slugs
        for (const p of productsMap.values()) {
            if (p.images.length > 0) {
                const guessed = slugToTitle(p.images[0]);
                if (guessed) p.title = guessed;
            }
        }

        const products = Array.from(productsMap.values());
        if (products.length === 0) {
            return NextResponse.json({ success: false, error: "Ürün çekilemedi." }, { status: 400 });
        }

        let batch = adminDb.batch();
        let syncCount = 0;
        for (const product of products) {
            const snapshot = await adminDb.collection("products").where("ticimaxId", "==", product.ticimaxId).get();
            const data = { ...product, updatedAt: new Date().toISOString() };
            if (!snapshot.empty) {
                batch.update(snapshot.docs[0].ref, data);
            } else {
                batch.set(adminDb.collection("products").doc(), { ...data, createdAt: new Date().toISOString() });
            }
            syncCount++;
            if (syncCount % 450 === 0) { await batch.commit(); batch = adminDb.batch(); }
        }
        await batch.commit();

        return NextResponse.json({ success: true, count: products.length });
    } catch (error) {
        console.error("Sync Error:", error);
        return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
    }
}
