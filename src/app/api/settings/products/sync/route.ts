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
    } catch {
        return "";
    }
}

interface SyncedVariant {
    id: number;
    sku: string;
    barcode: string;
    price: number;
    buyingPrice: number;
    stock: number;
    active: boolean;
    options: { type: string; value: string }[];
    images: string[];
}

interface SyncedProduct {
    ticimaxId: number;
    title: string;
    images: string[];
    price: { sale: number; buying: number };
    status: string;
    brandId: number;
    brandName: string;
    categoryId: string;
    categoryName: string;
    categoryIds: number[];
    variants: SyncedVariant[];
    _meta: { totalStock: number };
    importedAt: string;
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
        const password = process.env.TICIMAX_PASS;

        if (!userCode || !password) {
            return NextResponse.json({ success: false, error: "API Ayarları eksik" }, { status: 500 });
        }

        // 1. Fetch Metadata (Brands and Categories)
        const brandsXml = await ticimaxSoapCall(domain, "SelectMarka", `<SelectMarka xmlns='http://tempuri.org/'><UyeKodu>${userCode}</UyeKodu><Sifre>${password}</Sifre><MarkaID>0</MarkaID></SelectMarka>`);
        const catsXml = await ticimaxSoapCall(domain, "SelectKategori", `<SelectKategori xmlns='http://tempuri.org/'><UyeKodu>${userCode}</UyeKodu><Sifre>${password}</Sifre><KategoriId>0</KategoriId></SelectKategori>`);

        const brandMap = new Map<number, string>();
        const cleanBrands = brandsXml.replace(/<[a-zA-Z0-9_]+:([^>]+)>/g, '<$1>').replace(/<\/[a-zA-Z0-9_]+:([^>]+)>/g, '</$1>');
        const brandRegex = /<Marka[^>]*>([\s\S]*?)<\/Marka>/g;
        let bMatch;
        while ((bMatch = brandRegex.exec(cleanBrands)) !== null) {
            const block = bMatch[1];
            const id = parseInt(block.match(/<ID[^>]*>(\d+)<\/ID>/)?.[1] || "0");
            const name = block.match(/<Tanim[^>]*>(.*?)<\/Tanim>/)?.[1] || "";
            if (id) brandMap.set(id, name);
        }

        const catMap = new Map<number, string>();
        const cleanCats = catsXml.replace(/<[a-zA-Z0-9_]+:([^>]+)>/g, '<$1>').replace(/<\/[a-zA-Z0-9_]+:([^>]+)>/g, '</$1>');
        const catRegex = /<Kategori[^>]*>([\s\S]*?)<\/Kategori>/g;
        let cMatch;
        while ((cMatch = catRegex.exec(cleanCats)) !== null) {
            const block = cMatch[1];
            const id = parseInt(block.match(/<ID[^>]*>(\d+)<\/ID>/)?.[1] || "0");
            const name = block.match(/<Tanim[^>]*>(.*?)<\/Tanim>/)?.[1] || "";
            if (id) catMap.set(id, name);
        }

        // Save global category list for UI
        const categoriesList = Array.from(catMap.entries()).map(([id, name]) => ({
            id: id.toString(),
            name: name
        })).sort((a, b) => a.name.localeCompare(b.name, 'tr-TR'));

        await adminDb.collection('settings').doc('categories').set({
            list: categoriesList,
            updatedAt: new Date().toISOString()
        });

        // 2. Fetch Product Cards (to get canonical categories)
        const productsXml = await ticimaxSoapCall(domain, "SelectUrun", `
            <SelectUrun xmlns="http://tempuri.org/">
                <UyeKodu>${userCode}</UyeKodu>
                <Sifre>${password}</Sifre>
                <f>
                    <Aktif xmlns="http://schemas.datacontract.org/2004/07/">-1</Aktif>
                </f>
                <s>
                    <BaslangicIndex xmlns="http://schemas.datacontract.org/2004/07/">0</BaslangicIndex>
                    <KayitSayisi xmlns="http://schemas.datacontract.org/2004/07/">9999</KayitSayisi>
                </s>
            </SelectUrun>`);

        // Better cleanup: remove namespaces but keep content
        const cleanProducts = productsXml.replace(/<[a-zA-Z0-9_]+:([^>]+)>/g, '<$1>').replace(/<\/[a-zA-Z0-9_]+:([^>]+)>/g, '</$1>');
        
        const cardMetadataMap = new Map<number, { catId: string, catName: string, brandId: number, brandName: string }>();
        const cardRegex = /<UrunKarti[^>]*>([\s\S]*?)<\/UrunKarti>/g;
        let pMatch;
        while ((pMatch = cardRegex.exec(cleanProducts)) !== null) {
            const block = pMatch[1];
            const id = parseInt(block.match(/<ID[^>]*>(\d+)<\/ID>/)?.[1] || "0");
            const catId = block.match(/<AnaKategoriID[^>]*>(\d+)<\/AnaKategoriID>/)?.[1] || "";
            const brandId = parseInt(block.match(/<MarkaID[^>]*>(\d+)<\/MarkaID>/)?.[1] || "0");
            
            // Try to get name from catId using our master catMap first!
            let catName = catMap.get(parseInt(catId)) || "";
            if (!catName) {
                catName = block.match(/<AnaKategori[^>]*>(.*?)<\/AnaKategori>/)?.[1] || "";
            }

            // Also get brand name fallback
            let brandName = brandMap.get(brandId) || "";
            if (!brandName) {
                brandName = block.match(/<Marka[^>]*>(.*?)<\/Marka>/)?.[1] || "";
            }
            
            if (id) cardMetadataMap.set(id, { catId, catName, brandId, brandName });
        }

        // 3. Fetch Variations
        const variationsXml = await ticimaxSoapCall(domain, "SelectVaryasyon", `
            <SelectVaryasyon xmlns="http://tempuri.org/">
                <UyeKodu>${userCode}</UyeKodu>
                <Sifre>${password}</Sifre>
                <f><Aktif xmlns="http://schemas.datacontract.org/2004/07/">-1</Aktif></f>
                <s>
                    <BaslangicIndex xmlns="http://schemas.datacontract.org/2004/07/">0</BaslangicIndex>
                    <KayitSayisi xmlns="http://schemas.datacontract.org/2004/07/">9999</KayitSayisi>
                </s>
            </SelectVaryasyon>`);

        const cleanVar = variationsXml.replace(/<[a-zA-Z0-9_]+:([^>]+)>/g, '<$1>').replace(/<\/[a-zA-Z0-9_]+:([^>]+)>/g, '</$1>');
        const varRegex = /<Varyasyon[^>]*>([\s\S]*?)<\/Varyasyon>/g;

        const productsMap = new Map<number, SyncedProduct>();
        let vMatch;
        while ((vMatch = varRegex.exec(cleanVar)) !== null) {
            const block = vMatch[1];
            const cardIdMatch = block.match(/<UrunKartiID[^>]*>(\d+)<\/UrunKartiID>/);
            if (!cardIdMatch) continue;
            const cid = parseInt(cardIdMatch[1]);

            const id = parseInt(block.match(/<ID[^>]*>(\d+)<\/ID>/)?.[1] || "0");
            const sku = block.match(/<StokKodu[^>]*>(.*?)<\/StokKodu>/)?.[1] || "";
            const barcode = block.match(/<Barkod[^>]*>(.*?)<\/Barkod>/)?.[1] || "";
            const salePrice = parseFloat(block.match(/<SatisFiyati[^>]*>(.*?)<\/SatisFiyati>/)?.[1] || "0");
            const buyingPrice = parseFloat(block.match(/<AlisFiyati[^>]*>(.*?)<\/AlisFiyati>/)?.[1] || "0");
            const stock = parseFloat(block.match(/<StokAdedi[^>]*>(.*?)<\/StokAdedi>/)?.[1] || "0");
            const active = block.match(/<Aktif[^>]*>(true|false)<\/Aktif>/)?.[1] === 'true';
            const brandId = parseInt(block.match(/<MarkaID[^>]*>(\d+)<\/MarkaID>/)?.[1] || "0");

            // Extract Category IDs from Variation
            const vCatIds: number[] = [];
            const catBlock = block.match(/<Kategoriler[^>]*>([\s\S]*?)<\/Kategoriler>/)?.[1] || "";
            const catIdRegex = /<int[^>]*>(\d+)<\/int>/g;
            let cM;
            while ((cM = catIdRegex.exec(catBlock)) !== null) {
                vCatIds.push(parseInt(cM[1]));
            }

            const images: string[] = [];
            const imgBlock = block.match(/<Resimler[^>]*>([\s\S]*?)<\/Resimler>/)?.[1] || "";
            const imgRegex = /<string[^>]*>(.*?)<\/string>/g;
            let imM;
            while ((imM = imgRegex.exec(imgBlock)) !== null) {
                images.push(imM[1]);
            }

            const options: { type: string; value: string }[] = [];
            const optBlock = block.match(/<Ozellikler[^>]*>([\s\S]*?)<\/Ozellikler>/)?.[1] || "";
            const optRegex = /<VaryasyonOzellik[^>]*>([\s\S]*?)<\/VaryasyonOzellik>/g;
            let opM;
            while ((opM = optRegex.exec(optBlock)) !== null) {
                options.push({
                    type: opM[1].match(/<Tanim[^>]*>(.*?)<\/Tanim>/)?.[1] || "",
                    value: opM[1].match(/<Deger[^>]*>(.*?)<\/Deger>/)?.[1] || ""
                });
            }

            const variant = { id, sku, barcode, price: salePrice, buyingPrice, stock, active, options, images };

            // Resolve mappings from Product Card Metadata
            const cardMeta = cardMetadataMap.get(cid);
            
            // Determine Category
            let fallbackId = cardMeta?.catId || (vCatIds.length > 0 ? vCatIds[0].toString() : "");
            let fallbackName = cardMeta?.catName || "";
            
            if (!fallbackName && fallbackId) {
                fallbackName = catMap.get(parseInt(fallbackId)) || "";
            }
            if (!fallbackName && vCatIds.length > 0) {
                fallbackId = vCatIds[0].toString();
                fallbackName = catMap.get(vCatIds[0]) || "";
            }

            // Determine Brand
            const finalBrandId = brandId || cardMeta?.brandId || 0;
            const finalBrandName = brandMap.get(finalBrandId) || cardMeta?.brandName || "";

            if (!productsMap.has(cid)) {
                productsMap.set(cid, {
                    ticimaxId: cid,
                    title: sku,
                    images: images,
                    price: { sale: salePrice, buying: buyingPrice },
                    status: active ? 'published' : 'draft',
                    brandId: finalBrandId,
                    brandName: finalBrandName,
                    categoryId: fallbackId,
                    categoryName: fallbackName,
                    categoryIds: vCatIds,
                    variants: [variant],
                    _meta: { totalStock: stock },
                    importedAt: new Date().toISOString()
                });
            } else {
                const p = productsMap.get(cid)!;
                p.variants.push(variant);
                p._meta.totalStock += stock;
                if (salePrice > 0 && (p.price.sale === 0 || salePrice < p.price.sale)) {
                    p.price.sale = salePrice;
                    p.price.buying = buyingPrice;
                }
                images.forEach(img => { if (!p.images.includes(img)) p.images.push(img); });
                vCatIds.forEach(cat => { if (!p.categoryIds.includes(cat)) p.categoryIds.push(cat); });
                
                if (!p.categoryName && fallbackName) {
                    p.categoryId = fallbackId;
                    p.categoryName = fallbackName;
                }

                if (!p.brandName && finalBrandName) {
                    p.brandId = finalBrandId;
                    p.brandName = finalBrandName;
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
