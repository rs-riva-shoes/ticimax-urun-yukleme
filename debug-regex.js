const fs = require('fs');

const catsXml = `
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
  <s:Body>
    <SelectKategoriResponse xmlns="http://tempuri.org/">
      <SelectKategoriResult xmlns:a="http://schemas.datacontract.org/2004/07/" xmlns:i="http://www.w3.org/2001/XMLSchema-instance">
        <a:Kategori>
          <a:Aktif>true</a:Aktif>
          <a:ID>1</a:ID>
          <a:Icerik i:nil="true"/>
          <a:Kod>ROOT</a:Kod>
          <a:Pid>0</a:Pid>
          <a:Sira>1</a:Sira>
          <a:Tanim>Test Kategori</a:Tanim>
          <a:Url>/</a:Url>
        </a:Kategori>
      </SelectKategoriResult>
    </SelectKategoriResponse>
  </s:Body>
</s:Envelope>`;

const cleanCats = catsXml.replace(/<[a-zA-Z0-9_]+:/g, '<').replace(/<\/[a-zA-Z0-9_]+:/g, '</');
console.log("Clean Cats first 200 chars:", cleanCats.substring(0, 200));

const catMap = new Map();
const catRegex = /<Kategori>([\s\S]*?)<\/Kategori>/g;
let cMatch;
while ((cMatch = catRegex.exec(cleanCats)) !== null) {
    const block = cMatch[1];
    const idMatch = block.match(/<ID>(\d+)<\/ID>/);
    const nameMatch = block.match(/<Tanim>(.*?)<\/Tanim>/);
    console.log("Found Cat Index:", cMatch.index, "ID:", idMatch?.[1], "Name:", nameMatch?.[1]);
    if (idMatch) catMap.set(parseInt(idMatch[1]), nameMatch?.[1] || "");
}

console.log("CatMap size:", catMap.size);

const productsXml = fs.readFileSync('ticimax_test_output.xml', 'utf8');
const cleanProducts = productsXml.replace(/<[a-zA-Z0-9_]+:([^>]+)>/g, '<$1>').replace(/<\/[a-zA-Z0-9_]+:([^>]+)>/g, '</$1>');
const cardRegex = /<UrunKarti[^>]*>([\s\S]*?)<\/UrunKarti>/g;
let pMatch;
console.log("PardMatch start...");
while ((pMatch = cardRegex.exec(cleanProducts)) !== null) {
    const block = pMatch[1];
    const id = parseInt(block.match(/<ID[^>]*>(\d+)<\/ID>/)?.[1] || "0");
    const catId = block.match(/<AnaKategoriID[^>]*>(\d+)<\/AnaKategoriID>/)?.[1] || "";
    console.log("Product ID:", id, "CatID:", catId);
}
