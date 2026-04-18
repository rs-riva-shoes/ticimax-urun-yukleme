const fs = require('fs');

async function debugSelectUrun() {
    const domain = "https://www.rsrivashoes.com";
    const userCode = "3KF956KB3FBE4NIYPQTYKYGF66NHDJ";
    const password = "O8BXZ665";

    // Modifying parameter names to urunFiltre and urunSayfalama
    const soapEnv = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <SelectUrun xmlns="http://tempuri.org/">
        <UyeKodu>${userCode}</UyeKodu>
        <Sifre>${password}</Sifre>
        <urunFiltre>
            <Aktif xmlns="http://schemas.datacontract.org/2004/07/Ticimax.Modeller">-1</Aktif>
        </urunFiltre>
        <urunSayfalama>
            <BaslangicIndex xmlns="http://schemas.datacontract.org/2004/07/Ticimax.Modeller">0</BaslangicIndex>
            <KayitSayisi xmlns="http://schemas.datacontract.org/2004/07/Ticimax.Modeller">50</KayitSayisi>
        </urunSayfalama>
    </SelectUrun>
  </soap:Body>
</soap:Envelope>`;

    const res = await fetch(`${domain}/Servis/UrunServis.svc`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/xml; charset=utf-8', 'SOAPAction': 'http://tempuri.org/IUrunServis/SelectUrun' },
        body: soapEnv
    });
    const text = await res.text();
    fs.writeFileSync('debug_products_v2.xml', text, 'utf8');
    
    const count = (text.match(/<a:UrunKarti>/g) || []).length;
    console.log(`Found ${count} <a:UrunKarti> tags using urunFiltre/urunSayfalama.`);
}

debugSelectUrun().catch(console.error);
