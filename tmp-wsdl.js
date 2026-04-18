(async () => {
    const res = await fetch("https://www.rsrivashoes.com/Servis/UrunServis.svc?wsdl");
    const text = await res.text();
    const ops = text.match(/<wsdl:operation name="([^"]+)"/g) || [];
    const names = ops.map(o => o.replace('<wsdl:operation name="', '').replace('"', ''));
    console.log("Operations:", Array.from(new Set(names)));
})();
