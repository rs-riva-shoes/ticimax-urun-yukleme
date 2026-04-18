const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env.local') });

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        })
    });
}
const db = admin.firestore();

async function run() {
    const ticimaxUrl = process.env.TICIMAX_API_URL;
    const userCode = process.env.TICIMAX_USER_CODE;
    const password = process.env.TICIMAX_PASSWORD;

    const xml = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <SelectUrun xmlns="http://tempuri.org/">
      <UyeKodu>${userCode}</UyeKodu>
      <Sifre>${password}</Sifre>
      <f>
        <Aktif>-1</Aktif>
      </f>
    </SelectUrun>
  </soap:Body>
</soap:Envelope>`;

    console.log("Ticimax'tan kategoriler çekiliyor...");
    const res = await fetch(ticimaxUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/xml; charset=utf-8', 'SOAPAction': 'http://tempuri.org/IUrunServis/SelectUrun' },
        body: xml
    });
    const text = await res.text();
    
    const regex = /<a:UrunKarti[^>]*>(.*?)<\/a:UrunKarti>/gs;
    let match;
    const map = new Map();
    while ((match = regex.exec(text)) !== null) {
        const pxml = match[1];
        const sMatch = pxml.match(/<a:TedarikciKodu>(.*?)<\/a:TedarikciKodu>/);
        const cMatch = pxml.match(/<a:AnaKategoriID>(.*?)<\/a:AnaKategoriID>/);
        const cnMatch = pxml.match(/<a:AnaKategori>(.*?)<\/a:AnaKategori>/);
        if (sMatch && cMatch && parseInt(cMatch[1]) > 0) {
            map.set(sMatch[1], { cId: parseInt(cMatch[1]), cName: cnMatch?.[1] || "" });
        }
    }
    console.log(`Bulunan Ticimax ürünleri: ${map.size}`);
    if (map.size === 0) return;

    let total = 0;
    const snapshot = await db.collection('products').get();
    const batch = db.batch();
    snapshot.forEach(doc => {
        const d = doc.data();
        const sku = d.productCode || d.sku || d.barcode;
        if (sku && map.has(sku)) {
            const m = map.get(sku);
            if (!d.categoryId || parseInt(d.categoryId) !== m.cId) {
                batch.update(doc.ref, { categoryId: m.cId.toString(), categoryName: m.cName });
                total++;
            }
        }
    });
    
    if (total > 0) {
        await batch.commit();
        console.log(`✅ ${total} ürün güncellendi!`);
    } else {
        console.log(`✅ Güncellenecek yeni ürün bulunamadı. Tüm kategoriler zaten güncel.`);
    }
}
run().then(() => process.exit(0));
