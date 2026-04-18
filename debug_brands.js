const fs = require('fs');

async function ticimaxSoapCall(domain, action, body) {
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

async function debugBrands() {
    const domain = "https://www.rsrivashoes.com";
    const userCode = "3KF956KB3FBE4NIYPQTYKYGF66NHDJ";
    const password = "O8BXZ665";

    console.log("Fetching Brands...");
    const brandsXml = await ticimaxSoapCall(domain, "SelectMarka", `<SelectMarka xmlns='http://tempuri.org/'><UyeKodu>${userCode}</UyeKodu><Sifre>${password}</Sifre><MarkaID>0</MarkaID></SelectMarka>`);
    
    const brandMap = new Map();
    const cleanBrands = brandsXml.replace(/<[a-zA-Z0-9_]+:([^>]+)>/g, '<$1>').replace(/<\/[a-zA-Z0-9_]+:([^>]+)>/g, '</$1>');
    const brandRegex = /<Marka[^>]*>([\s\S]*?)<\/Marka>/g;
    let bMatch;
    while ((bMatch = brandRegex.exec(cleanBrands)) !== null) {
        const block = bMatch[1];
        const id = parseInt(block.match(/<ID[^>]*>(\d+)<\/ID>/)?.[1] || "0");
        const name = block.match(/<Tanim[^>]*>(.*?)<\/Tanim>/)?.[1] || "";
        if (id) brandMap.set(id, name);
    }
    console.log(`Fetched ${brandMap.size} brands.`);
    if (brandMap.size > 0) {
        console.log("Sample Brands:", Array.from(brandMap.entries()).slice(0, 5));
    }
}

debugBrands().catch(console.error);
