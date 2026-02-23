import { NextResponse } from "next/server";
import { openai } from "@/lib/openai";

export async function POST(req: Request) {
    try {
        const { images } = await req.json();

        if (!images || images.length === 0) {
            return NextResponse.json({ error: "at least one image is required" }, { status: 400 });
        }

        // Prepare image content for OpenAI Vision API
        const imageContent = images.slice(0, 2).map((img: string) => ({
            type: "image_url",
            image_url: {
                url: img,
                detail: "low"
            }
        }));

        const prompt = `Sen Trendyol, Hepsiburada gibi pazar yerlerinde satış yapan, SEO odaklı ürün isimlendirme uzmanısın.
**GÖREV:** Verilen görseli analiz et ve arama motorlarında maksimum görünürlük sağlayacak "Anahtar Kelime Odaklı" (Keyword Stuffing stili) bir ürün başlığı oluştur.

**BAŞLIK STRATEJİSİ (Örnekteki gibi olmalı):**
"Kadın Yüksek Taban Ortopedik Eva Aşçı Hastane Havuz Hemşire Doktor Plaj Bahçe Cross"

**BAŞLIK YAPISI:**
[Cinsiyet] + [Ana Özellikler] + [Materyal] + [Kullanım Alanları/Meslekler] + [Tarz/Model]

**KURALLAR:**
1. **ASLA VE, VEYA, İLE KULLANMA:** Kelimeler sadece boşlukla ayrılsın.
2. **RENK YAZMA:** Renk varyantta seçileceği için başlıkta olma-ma-lı.
3. **BOLCA ANAHTAR KELİME:** Ürünün kullanılabileceği her yeri ve durumu yaz. (Örn: Terlik ise -> Hastane, Okul, Plaj, Balkon, Bahçe, Aşçı, Hemşire, Doktor, Temizlik).
4. **TEKNİK DETAYLAR:** Varsa 'Anatomik', 'Ortopedik', 'Kaymaz', 'Yıkanabilir', 'Terletmez' gibi teknik terimleri ekle.
5. **UZUNLUK:** Başlık dolu dolu olsun, kısa kesme.

**YANIT FORMATI (JSON):**
{
  "suggestedName": "oluşturulan uzun başlık",
  "productType": "tahmin edilen ürün tipi",
  "confidence": "yüksek"
}

**KRİTİK:** Sadece geçerli bir JSON nesnesi döndür.`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "Sen bir e-ticaret ürün isimlendirme uzmanısın. Ürün görsellerini analiz ederek kısa, açıklayıcı ve profesyonel isimler önerirsin."
                },
                {
                    role: "user",
                    content: [
                        { type: "text", text: prompt },
                        ...imageContent
                    ]
                }
            ],
            response_format: { type: "json_object" },
            temperature: 0.5,
            max_tokens: 200
        });

        const result = JSON.parse(completion.choices[0].message.content || "{}");

        return NextResponse.json({
            success: true,
            suggestedName: result.suggestedName || "Ürün",
            productType: result.productType || "Bilinmiyor",
            confidence: result.confidence || "orta"
        });

    } catch (error: unknown) {
        console.error("AI Name Suggestion Error:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
