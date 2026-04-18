import { env } from '@/config/env';
import { NextResponse } from 'next/server';
import { adminDb } from '@/services/firebase-admin';

export async function POST() {
    try {
        const domain = env.TICIMAX_DOMAIN;
        const userCode = env.TICIMAX_USER;
        const password = env.TICIMAX_PASS;

        if (!userCode || !password) {
            return NextResponse.json({ success: false, error: "API Ayarları eksik" }, { status: 500 });
        }

        const soapBody = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <SelectKategori xmlns="http://tempuri.org/">
      <UyeKodu>${userCode}</UyeKodu>
      <Sifre>${password}</Sifre>
    </SelectKategori>
  </soap:Body>
</soap:Envelope>`;

        const apiUrl = `${domain.replace(/\/$/, '')}/Servis/UrunServis.svc`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/xml; charset=utf-8',
                'SOAPAction': 'http://tempuri.org/IUrunServis/SelectKategori'
            },
            body: soapBody
        });

        const responseText = await response.text();

        if (!response.ok) {
            return NextResponse.json({ success: false, error: "Ticimax bağlantı hatası" }, { status: 500 });
        }

        interface CategoryItem {
            id: string;
            name: string;
            parentId: string;
        }
        const categories: CategoryItem[] = [];
        const cleanXml = responseText.replace(/<[a-zA-Z0-9_]+:/g, '<').replace(/<\/[a-zA-Z0-9_]+:/g, '</');
        const catRegex = /<Kategori>([\s\S]*?)<\/Kategori>/g;
        let match;

        while ((match = catRegex.exec(cleanXml)) !== null) {
            const catBlock = match[1];
            const idMatch = catBlock.match(/<ID>(\d+)<\/ID>/);
            const nameMatch = catBlock.match(/<Tanim>(.*?)<\/Tanim>/);
            const parentIdMatch = catBlock.match(/<ParentID>(\d+)<\/ParentID>/);

            if (idMatch && nameMatch) {
                categories.push({
                    id: idMatch[1],
                    name: nameMatch[1],
                    parentId: parentIdMatch ? parentIdMatch[1] : "0"
                });
            }
        }

        // Alfabetik sırala
        categories.sort((a, b) => a.name.localeCompare(b.name, 'tr-TR'));

        // Write to Firestore
        const docRef = adminDb.collection('settings').doc('categories');
        await docRef.set({
            list: categories,
            updatedAt: new Date().toISOString()
        });

        return NextResponse.json({
            success: true,
            count: categories.length,
            message: `${categories.length} kategori Firebase'e kaydedildi.`
        });

    } catch (error) {
        console.error("Error syncing categories:", error);
        return NextResponse.json({ success: false, error: "Kategoriler güncellenemedi" }, { status: 500 });
    }
}
