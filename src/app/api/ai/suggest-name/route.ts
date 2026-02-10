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

        const prompt = `Sen bir e-ticaret ürün isimlendirme ve SEO uzmanısın. Verilen ürün görsellerini analiz ederek arama motorlarında (Google) üst sıralara çıkacak, tıklama oranı yüksek, profesyonel bir ürün başlığı oluştur.

**GÖREV:**
1. Görselleri detaylı analiz et.
2. Ürünün kullanım alanını ve hedef kitlesini belirle (Örn: Çocuk terliği ise -> Okul, Kreş, Ev, Plaj vb.).
3. **KESİNLİKLE RENK BİLGİSİ EKLENMEYECEK.** (Renk varyantlarda seçileceği için başlıkta olmamalı).
4. İlgili SEO anahtar kelimelerini doğal bir şekilde başlığa yedir.
5. Marka belirtilmediyse marka adı kullanma.
6. Başlık 4-8 kelime arasında, çarpıcı ve açıklayıcı olsun.

**KURALLAR:**
- ❌ YASAK: "Kırmızı", "Mavi", "Siyah" gibi renk isimleri başlıkta ASLA geçmeyecek.
- ✅ ZORUNLU: Ürün tipine göre kullanım yeri belirtilecek (Örn: "Ortopedik Kreş ve Okul Terliği", "Günlük Rahat Yürüyüş Ayakkabısı").
- ✅ ZORUNLU: Türkçe karakter uyumu ve imla kurallarına dikkat edilecek.

**ÖRNEK SENARYOLAR:**
- Girdi: Çocuk Terliği görseli -> Çıktı: "Ortopedik Kaymaz Tabanlı Kreş ve Okul İçi Çocuk Terliği"
- Girdi: Kadın Topuklu Ayakkabı -> Çıktı: "Konfor Tabanlı Şık Ofis ve Davet Stiletto"
- Girdi: Erkek Spor Ayakkabı -> Çıktı: "Hafif Tabanlı Nefes Alan Günlük Koşu ve Yürüyüş Ayakkabısı"

**YANIT FORMATI (JSON):**
{
  "suggestedName": "önerilen ürün adı",
  "productType": "ürün tipi (örn: sneaker, bot, sandalet)",
  "confidence": "yüksek/orta/düşük"
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
