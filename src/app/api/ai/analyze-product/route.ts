import { NextResponse } from "next/server";
import { openai } from "@/services/openai";
import hierarchicalCategories from "@/data/hierarchical-categories.json";
import productTypeCategories from "@/data/product-type-categories.json";
import { logger, withRetry, handleApiError } from "@/utils/safety";


interface ProductTypeCategory {
    id: string;
    name: string;
    displayName: string;
}

interface Attribute {
    featureId: number;
    name: string;
    values: { valueId: number; name: string }[];
}

interface Subcategory {
    ids: string[];
    name: string;
}

interface MainCategory {
    id: string;
    name: string;
    subcategories: Record<string, Subcategory>;
}

export async function POST(req: Request) {

    try {
        if (!openai) {
            return NextResponse.json({ error: "OpenAI API Key is missing" }, { status: 500 });
        }
        const { title, images, categories, attributes } = await req.json();

        // Title is optional if images are provided
        // if (!title) {
        //    return NextResponse.json({ error: "title is required" }, { status: 400 });
        // }

        if (!images || images.length === 0) {
            return NextResponse.json({ error: "at least one image is required" }, { status: 400 });
        }

        if (!categories || categories.length === 0) {
            return NextResponse.json({ error: "categories list is required" }, { status: 400 });
        }


        // Create hierarchical categories list for AI
        const hierarchicalCategoryList = Object.values(hierarchicalCategories as Record<string, MainCategory>).map((data) => {
            const subcats = Object.values(data.subcategories).map((subdata) => {
                return `  - ${subdata.name}: IDs [${subdata.ids.join(", ")}]`;
            }).join("\n");
            return `${data.name} (ID: ${data.id}):\n${subcats}`;
        }).join("\n\n");

        // Create product type categories list for AI
        const productTypeCategoryList = productTypeCategories.map((c: ProductTypeCategory) =>
            `ID: ${c.id} - ${c.name}`
        ).join("\n");

        // Create attributes list for AI
        const attributesList = attributes?.map((attr: Attribute) => {
            const values = attr.values.map(v => `${v.valueId}:${v.name}`).join(", ");
            return `${attr.featureId}. ${attr.name}: [${values}]`;
        }).join("\n") || "Özellik bilgisi yok";

        // Prepare image content for OpenAI Vision API
        // Images should be base64 encoded data URLs
        const imageContent = images.slice(0, 3).map((img: string) => ({
            type: "image_url",
            image_url: {
                url: img, // Should be base64 data URL or public URL
                detail: "low" // Use "low" for faster/cheaper analysis, "high" for detailed
            }
        }));

        const cleanTitle = title || "Belirtilmemiş (Görsellere göre analiz et)";

        const prompt = `Sen uzman bir ürün sınıflandırma ve teknik analiz yapay zekasısın.
**GÖREVLER:**
1. **KATEGORİ TESPİTİ:** Ürünün görselini analiz et ve aşağıdaki kategoriler arasından EN DOĞRU olanı seç. Yanlış kategori seçimi kabul edilemez.
2. **TEKNİK DETAY TESPİTİ:** Görseldeki ince detayları (bağcık, desen, topuk boyu, materyal) analiz et ve listedeki seçeneklerle eşleştir.

**GİRDİLER:**
- **ÜRÜN BAŞLIĞI:** ${cleanTitle}
- **HİYERARŞİK KATEGORİ LISTESI (Sadece buradan seç):**
${hierarchicalCategoryList}

- **ÜRÜN TİPİ LISTESI (Sadece buradan seç):**
${productTypeCategoryList}

- **TEKNİK ÖZELLİK HAVUZU:**
${attributesList}

**ADIM 1: AÇIKLAMA (TRENDYOL STİLİ - HTML)**
- Sadece <ul><li> yapısında yaz. 
- Her madde "Özellik + Sağladığı Fayda" şeklinde olmalıdır. (Örn: "Özel Phylon Taban: Hafif yapısıyla gün boyu yorulmadan hareket etmenizi sağlar.")
- Mutlaka Materyal, İç astar, Taban yapısı ve Kullanım alanı bilgilerini içer.
- Sonuna şu notu ekle: "<div style='font-size:11px; color:#888; margin-top:10px;'>Stüdyo çekimlerinde ışık farklılığından dolayı renkler değişiklik gösterebilir.</div>"

**ADIM 2: KATEGORİ VE ÖZELLİK SEÇİMİ**
- Ürünün görselini havuzdaki özelliklerle eşleştir. 
- Topuk boyu, Materyal, Kapama şekli ve Desen özelliklerini "attributeSelections" içine ID olarak ekle.
- **attributeSelections** asla boş kalmamalı. En az 4 tane teknik özellik ID'si bul.

**ADIM 3: BAŞLIK OPTİMİZASYONU**
- Trendyol için ideal başlık: [Marka] + [Materyal] + [Öne Çıkan Özellik] + [Ürün Tipi] + [Kullanım Alanı]
- Örnek: "Arslan Hakiki Deri Ortopedik Rahat Taban Sneaker Ayakkabı"

**YANIT FORMATI (JSON):**
{
  "hierarchicalCategoryIds": ["ID1", "ID2", "ID3"],
  "hierarchicalCategoryName": "Kategori Adı",
  "productTypeCategoryId": "ID",
  "productTypeCategoryName": "İsim",
  "suggestedTitle": "Trendyol'a Uygun Optimize Başlık",
  "descriptionHtml": "<ul><li>...</li></ul>",
  "attributeSelections": {
    "featureId": "valueId",
    "featureId2": "valueId2"
  },
  "usageTips": "Kalıp bilgisi veya bakım önerisi (Örn: Tam kalıptır, ayak yapınız genişse 1 numara büyük önerilir.)"
}

**KRİTİK:** OpenAI Vision'ı kullanarak ayakkabının materyalini (Rugan, Süet, Deri) ve tabanını (Eva, Kauçuk, Poli) fotoğraftan TAHMİN ET ve içeriği ona göre doldur.`;

        logger.info('AI Product Analysis Pipeline Started', { title: title || 'N/A', imageCount: images.length });

        const completion = await withRetry(async () => {
            const result = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: "Sen bir Trendyol Kategori ve İçerik Yönetimi uzmanısın. JSON formatında, hatasız ve profesyonel e-ticaret verisi üretirsin."
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
                temperature: 0.2,
                max_tokens: 4000
            });
            return result;
        }, { maxRetries: 2, delay: 1500 });

        const analysis = JSON.parse(completion.choices[0].message.content || "{}");
        logger.info('AI Vision Analysis Result Received', { suggestedTitle: analysis.suggestedTitle });

        // Validate hierarchical category
        if (!analysis.hierarchicalCategoryIds || !Array.isArray(analysis.hierarchicalCategoryIds)) {
            analysis.hierarchicalCategoryIds = ["37", "40", "46"];
            analysis.hierarchicalCategoryName = "Kadın Sneaker";
            analysis.hierarchicalCategoryReason = "Otomatik seçildi (AI tahmini geçersiz)";
        }

        // Validate product type category
        const selectedProductType = productTypeCategories.find(
            (c: ProductTypeCategory) => c.id === analysis.productTypeCategoryId
        );
        if (!selectedProductType) {
            analysis.productTypeCategoryId = productTypeCategories[0].id;
            analysis.productTypeCategoryName = productTypeCategories[0].name;
            analysis.productTypeCategoryReason = "Otomatik seçildi (AI tahmini geçersiz)";
        } else {
            analysis.productTypeCategoryName = selectedProductType.name;
        }

        // Keep old categoryId for backward compatibility (use product type category)
        analysis.categoryId = analysis.productTypeCategoryId;
        analysis.categoryName = analysis.productTypeCategoryName;
        analysis.categoryReason = analysis.productTypeCategoryReason;

        return NextResponse.json({
            success: true,
            ...analysis
        });

    } catch (error: unknown) {
        return handleApiError(error);
    }
}
