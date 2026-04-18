const fs = require('fs');
const envFile = fs.readFileSync('./.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        env[match[1].trim()] = match[2].trim().replace(/^"|"$/g, '');
    }
});

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

async function testFetch() {
    const domain = env.TICIMAX_DOMAIN || "https://www.siteadi.com";
    const userCode = env.TICIMAX_USER;
    const password = env.TICIMAX_PASS;

    const xml = await ticimaxSoapCall(domain, "SelectVaryasyon", `
            <SelectVaryasyon xmlns="http://tempuri.org/">
                <UyeKodu>${userCode}</UyeKodu>
                <Sifre>${password}</Sifre>
                <f><Aktif xmlns="http://schemas.datacontract.org/2004/07/">-1</Aktif></f>
                <s>
                    <BaslangicIndex xmlns="http://schemas.datacontract.org/2004/07/">0</BaslangicIndex>
                    <KayitSayisi xmlns="http://schemas.datacontract.org/2004/07/">5000</KayitSayisi>
                </s>
            </SelectVaryasyon>`);

    fs.writeFileSync('ticimax_test_output_var.xml', xml, 'utf8');
}

testFetch().catch(console.error);
