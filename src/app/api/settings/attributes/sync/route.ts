import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import path from 'path';

// Helper: XML Special Chars Escape
const escapeXml = (unsafe: string) => {
    return unsafe.replace(/[<>&'"]/g, function (c) {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
            default: return c;
        }
    });
};

// Start SOAP Request Helper
async function fetchTicimax(action: string, soapBody: string) {
    const domain = process.env.TICIMAX_DOMAIN || "https://www.siteadi.com";
    const apiUrl = `${domain.replace(/\/$/, '')}/Servis/UrunServis.svc`;

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/xml; charset=utf-8',
            'SOAPAction': `http://tempuri.org/IUrunServis/${action}`
        },
        body: soapBody
    });

    return await response.text();
}

// Helper: Extract Items from XML using Regex
function extractItems(xml: string, tagName: string): any[] {
    const items: any[] = [];
    // Clean Namespaces
    const cleanXml = xml.replace(/<[a-zA-Z0-9_]+:/g, '<').replace(/<\/[a-zA-Z0-9_]+:/g, '</');

    const regex = new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, 'g');
    let match;

    while ((match = regex.exec(cleanXml)) !== null) {
        const block = match[1];
        const idMatch = block.match(/<ID>(\d+)<\/ID>/);
        const nameMatch = block.match(/<Tanim>(.*?)<\/Tanim>/);
        const featureIdMatch = block.match(/<OzellikID>(\d+)<\/OzellikID>/); // For Values

        if (idMatch && nameMatch) {
            items.push({
                id: idMatch[1],
                name: nameMatch[1],
                featureId: featureIdMatch ? featureIdMatch[1] : null
            });
        }
    }
    return items;
}

export async function POST() {
    try {
        const userCode = process.env.TICIMAX_USER;
        if (!userCode) {
            return NextResponse.json({ success: false, error: "API credentials missing" }, { status: 500 });
        }

        // 1. Fetch Features (Teknik Detay Özellikleri)
        const featuresBody = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <SelectTeknikDetayOzellik xmlns="http://tempuri.org/">
      <UyeKodu>${userCode}</UyeKodu>
      <f>
        <ID>0</ID>
        <Dil>tr</Dil>
      </f>
    </SelectTeknikDetayOzellik>
  </soap:Body>
</soap:Envelope>`;

        console.log("Fetching Features...");
        const featuresXml = await fetchTicimax('SelectTeknikDetayOzellik', featuresBody);

        // Custom extract for Features to get GrupID
        const features: any[] = [];
        const cleanFeaturesXml = featuresXml.replace(/<[a-zA-Z0-9_]+:/g, '<').replace(/<\/[a-zA-Z0-9_]+:/g, '</');
        const featureRegex = /<TeknikDetayOzellik>([\s\S]*?)<\/TeknikDetayOzellik>/g;
        let featMatch;
        while ((featMatch = featureRegex.exec(cleanFeaturesXml)) !== null) {
            const block = featMatch[1];
            const id = block.match(/<ID>(\d+)<\/ID>/)?.[1];
            const name = block.match(/<Tanim>(.*?)<\/Tanim>/)?.[1];
            const grpId = block.match(/<GrupID>(\d+)<\/GrupID>/)?.[1];

            if (id && name) {
                features.push({ id, name, groupId: grpId || "0" });
            }
        }

        console.log(`Found ${features.length} features.`);

        // 2. Fetch Values
        const valuesBody = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <SelectTeknikDetayDeger xmlns="http://tempuri.org/">
      <UyeKodu>${userCode}</UyeKodu>
      <f>
        <ID>0</ID>
        <OzellikID>0</OzellikID>
        <Dil>tr</Dil>
      </f>
    </SelectTeknikDetayDeger>
  </soap:Body>
</soap:Envelope>`;

        console.log("Fetching Values...");
        const valuesXml = await fetchTicimax('SelectTeknikDetayDeger', valuesBody);

        const values: any[] = [];
        const cleanValuesXml = valuesXml.replace(/<[a-zA-Z0-9_]+:/g, '<').replace(/<\/[a-zA-Z0-9_]+:/g, '</');
        const valRegex = /<TeknikDetayDeger>([\s\S]*?)<\/TeknikDetayDeger>/g;
        let valMatch;
        while ((valMatch = valRegex.exec(cleanValuesXml)) !== null) {
            const block = valMatch[1];
            const id = block.match(/<ID>(\d+)<\/ID>/)?.[1];
            const name = block.match(/<Tanim>(.*?)<\/Tanim>/)?.[1];
            const fId = block.match(/<OzellikID>(\d+)<\/OzellikID>/)?.[1];

            if (id && name) {
                values.push({ id, name, featureId: fId });
            }
        }
        console.log(`Found ${values.length} values.`);

        // 3. Map Values to Features
        const attributesMapping = features.map(feature => {
            const featureValues = values.filter(v => v.featureId === feature.id).map(v => ({
                valueId: v.id,
                valueName: v.name
            }));

            return {
                featureId: feature.id,
                featureName: feature.name,
                groupId: feature.groupId || "0",
                values: featureValues
            };
        }); // Removed filter(f => f.values.length > 0) to debug/include all features

        // 4. Store in Firestore
        await adminDb.collection('settings').doc('attributes').set({
            list: attributesMapping,
            updatedAt: new Date().toISOString()
        });

        return NextResponse.json({
            success: true,
            message: "Attributes synced successfully to Firebase",
            counts: {
                features: features.length,
                values: values.length,
                mappedFeatures: attributesMapping.length
            }
        });

    } catch (error) {
        console.error("Sync Error:", error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
