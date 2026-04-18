(async () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <SelectKategori xmlns="http://tempuri.org/">
      <UyeKodu>3KF956KB3FBE4NIYPQTYKYGF66NHDJ</UyeKodu>
      <Sifre>O8BXZ665</Sifre>
    </SelectKategori>
  </soap:Body>
</soap:Envelope>`;

    const res = await fetch("https://www.rsrivashoes.com/Servis/UrunServis.svc", {
        method: "POST",
        headers: { "Content-Type": "text/xml; charset=utf-8", "SOAPAction": "http://tempuri.org/IUrunServis/SelectKategori" },
        body: xml
    });
    const text = await res.text();
    console.log(text.substring(0, 1000));
})();
