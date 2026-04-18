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

async function debugSync() {
    const domain = "https://www.rsrivashoes.com";
    const userCode = "3KF956KB3FBE4NIYPQTYKYGF66NHDJ";
    const password = "O8BXZ665";
    let logs = "";

    const catsXml = await ticimaxSoapCall(domain, "SelectKategori", `<SelectKategori xmlns='http://tempuri.org/'><UyeKodu>${userCode}</UyeKodu><Sifre>${password}</Sifre><KategoriId>0</KategoriId></SelectKategori>`);
    const catMap = new Map();
    const cleanCats = catsXml.replace(/<[a-zA-Z0-9_]+:([^>]+)>/g, '<$1>').replace(/<\/[a-zA-Z0-9_]+:([^>]+)>/g, '</$1>');
    const catRegex = /<Kategori[^>]*>([\s\S]*?)<\/Kategori>/g;
    let cMatch;
    while ((cMatch = catRegex.exec(cleanCats)) !== null) {
        const block = cMatch[1];
        const id = parseInt(block.match(/<ID[^>]*>(\d+)<\/ID>/)?.[1] || "0");
        const name = block.match(/<Tanim[^>]*>(.*?)<\/Tanim>/)?.[1] || "";
        if (id) catMap.set(id, name);
    }
    logs += `Fetched ${catMap.size} categories.\n`;

    const productsXml = await ticimaxSoapCall(domain, "SelectUrun", `
            <SelectUrun xmlns="http://tempuri.org/">
                <UyeKodu>${userCode}</UyeKodu>
                <Sifre>${password}</Sifre>
                <f><Aktif xmlns="http://schemas.datacontract.org/2004/07/Ticimax.Modeller">-1</Aktif></f>
                <s>
                    <BaslangicIndex xmlns="http://schemas.datacontract.org/2004/07/Ticimax.Modeller">0</BaslangicIndex>
                    <KayitSayisi xmlns="http://schemas.datacontract.org/2004/07/Ticimax.Modeller">500</KayitSayisi>
                </s>
            </SelectUrun>`);
    const cleanProducts = productsXml.replace(/<[a-zA-Z0-9_]+:([^>]+)>/g, '<$1>').replace(/<\/[a-zA-Z0-9_]+:([^>]+)>/g, '</$1>');
    const cardCatMap = new Map();
    const cardRegex = /<UrunKarti[^>]*>([\s\S]*?)<\/UrunKarti>/g;
    let pMatch;
    while ((pMatch = cardRegex.exec(cleanProducts)) !== null) {
        const block = pMatch[1];
        const id = parseInt(block.match(/<ID[^>]*>(\d+)<\/ID>/)?.[1] || "0");
        const catIdStr = block.match(/<AnaKategoriID[^>]*>(\d+)<\/AnaKategoriID>/)?.[1] || "";
        const catName = catMap.get(parseInt(catIdStr)) || block.match(/<AnaKategori[^>]*>(.*?)<\/AnaKategori>/)?.[1] || "";
        if (id) cardCatMap.set(id, { id: catIdStr, name: catName });
    }
    logs += `Matched ${cardCatMap.size} product cards.\n`;

    const variationsXml = await ticimaxSoapCall(domain, "SelectVaryasyon", `
            <SelectVaryasyon xmlns="http://tempuri.org/">
                <UyeKodu>${userCode}</UyeKodu>
                <Sifre>${password}</Sifre>
                <f><Aktif xmlns="http://schemas.datacontract.org/2004/07/">-1</Aktif></f>
                <s>
                    <BaslangicIndex xmlns="http://schemas.datacontract.org/2004/07/">0</BaslangicIndex>
                    <KayitSayisi xmlns="http://schemas.datacontract.org/2004/07/">100</KayitSayisi>
                </s>
            </SelectVaryasyon>`);
    const cleanVar = variationsXml.replace(/<[a-zA-Z0-9_]+:([^>]+)>/g, '<$1>').replace(/<\/[a-zA-Z0-9_]+:([^>]+)>/g, '</$1>');
    const varRegex = /<Varyasyon[^>]*>([\s\S]*?)<\/Varyasyon>/g;
    let vMatch;
    let results = [];
    while ((vMatch = varRegex.exec(cleanVar)) !== null) {
        const block = vMatch[1];
        const cid = parseInt(block.match(/<UrunKartiID[^>]*>(\d+)<\/UrunKartiID>/)?.[1] || "0");
        const id = parseInt(block.match(/<ID[^>]*>(\d+)<\/ID>/)?.[1] || "0");
        const cardCat = cardCatMap.get(cid);
        
        const vCatIds = [];
        const catBlock = block.match(/<Kategoriler[^>]*>([\s\S]*?)<\/Kategoriler>/)?.[1] || "";
        const catIdRegex = /<int[^>]*>(\d+)<\/int>/g;
        let cM;
        while ((cM = catIdRegex.exec(catBlock)) !== null) vCatIds.push(parseInt(cM[1]));

        let finalName = cardCat?.name || (vCatIds.length > 0 ? catMap.get(vCatIds[0]) : "") || "";
        results.push({ vid: id, cid, cardCatName: cardCat?.name, vCats: vCatIds.join(','), finalName });
    }
    
    logs += `Total variations checked: ${results.length}\n`;
    logs += `Variation mappings sample:\n` + JSON.stringify(results.slice(0, 20), null, 2);
    
    fs.writeFileSync('verify_output.txt', logs, 'utf8');
}

debugSync().catch(console.error);
