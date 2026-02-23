import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { openai } from "@/lib/openai";

export async function POST(req: Request) {
    try {
        const { productId } = await req.json();

        if (!productId) {
            return NextResponse.json({ error: "productId is required" }, { status: 400 });
        }

        const docRef = adminDb.collection("products").doc(productId);
        const doc = await docRef.get();

        if (!doc.exists) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        const data = doc.data();
        const title = data?.title || "Unknown Product";
        const categoryName = "Category"; // Ideally fetch category name from ID or text line stored
        const brand = data?.brand || "Brand";

        const prompt = `
      Sen Trendyol/Hepsiburada stili, yapılandırılmış ürün içerikleri hazırlayan uzman bir editörsün.
      Aşağıdaki ürün için teknik ve profesyonel bir içerik oluştur:
      Başlık: ${title}
      Marka: ${brand}
      Kategori: ${categoryName}
      
      ÇIKTI FORMATI (JSON):
      - descriptionHtml: (HTML formatında. SADECE <ul> listesi oluştur. Her madde "Özellik + Fayda" şeklinde olmalı.)
      - bulletPoints: (En önemli 3-5 özellik, kısa ve net)
      - technicalDetails: (Örn: [{"label": "Materyal", "value": "%100 Pamuk"}])
      - keywords: (10 adet SEO anahtar kelimesi, virgülle ayrılmış değil array olarak)
      
      DİL: Türkçe.
      TON: Kurumsal, net, yapılandırılmış.
      
      FORMAT ÖRNEĞİ (HTML):
      <ul>
        <li><strong>Ortopedik Tasarım:</strong> Ayak anatomisine uygun yapısıyla gün boyu konfor sağlar.</li>
        <li><strong>Kaymaz Taban:</strong> Güvenli adımlar atmanızı destekler.</li>
      </ul>
      <div style="font-size:12px; color:#666; margin-top:10px;">Stüdyo çekimlerinde renkler ışık farklılığından dolayı değişiklik gösterebilir.</div>
    `;

        const completion = await openai.chat.completions.create({
            messages: [{ role: "system", content: "You are a helpful assistant." }, { role: "user", content: prompt }],
            model: "gpt-4o-mini",
            response_format: { type: "json_object" },
        });

        const content = JSON.parse(completion.choices[0].message.content || "{}");

        // Update product
        await docRef.update({
            descriptionHtml: content.descriptionHtml,
            bulletPoints: content.bulletPoints,
            technicalDetails: content.technicalDetails, // Note: these are text details, not Ticimax IDs
            keywords: content.keywords,
            status: "ai_ready",
            updatedAt: new Date()
        });

        return NextResponse.json({ success: true, data: content });
    } catch (error: unknown) {
        console.error("AI Fill Error:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
