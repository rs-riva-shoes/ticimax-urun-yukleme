import { NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import hierarchicalCategories from "@/data/hierarchical-categories.json";
import productTypeCategories from "@/data/product-type-categories.json";

interface Category {
    id: string;
    name: string;
}

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

export async function POST(req: Request) {
    console.log("--- DEBUG: API Key Check ---");
    const key = process.env.APP_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    console.log("Kullanılan Anahtar:", process.env.APP_OPENAI_API_KEY ? "APP_OPENAI_API_KEY (.env.local)" : "OPENAI_API_KEY (Sistem/Env)");
    console.log("Key Mevcut mu:", !!key);
    console.log("Key Uzunluğu:", key?.length);
    console.log("Key Başlangıç:", key?.substring(0, 8));
    if (key?.includes('"')) console.log("UYARI: Key içinde tırnak işareti var!");
    if (key?.trim() !== key) console.log("UYARI: Key başında/sonunda boşluk var!");

    try {
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

        // Create category list for AI
        const categoryList = categories.map((c: Category) => `ID: ${c.id} - ${c.name}`).join("\n");

        // Create hierarchical categories list for AI
        const hierarchicalCategoryList = Object.entries(hierarchicalCategories).map(([mainCat, data]: [string, any]) => {
            const subcats = Object.entries(data.subcategories).map(([key, subdata]: [string, any]) => {
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

        const prompt = `Sen deneyimli bir e-ticaret içerik editörü ve SEO uzmanısın. Verilen ürün görselleri ve (varsa) başlığı analiz ederek, müşteriyi satın almaya ikna edecek **ZENGİN, PROFESYONEL VE DETAYLI** bir ürün açıklaması yazmalısın. Ayrıca doğru kategorileri ve özellikleri seçmelisin.

**GİRDİLER:**
- **ÜRÜN BAŞLIĞI:** ${cleanTitle}
- **HİYERARŞİK KATEGORİLER:**
${hierarchicalCategoryList}
- **ÜRÜN TİPİ KATEGORİLERİ:**
${productTypeCategoryList}
- **MEVCUT TEKNİK ÖZELLİKLER:**
${attributesList}

**1. DETAYLI ÜRÜN AÇIKLAMASI (HTML FORMATINDA):**
- **Hedef:** Müşteriye ürünü hayal ettir, özelliklerini ve faydalarını "dolu dolu" ve "pazarlama diliyle" anlat.
- **İçerik:**
  - Giriş: Ürünü çekici bir dille tanıt (1 paragraf).
  - Kullanım Alanları: Nerede giyilir/kullanılır? (Örn: Okul, kreş, ofis, günlük, düğün). İlgili anahtar kelimeleri (keywords) bolca kullan.
  - Özellikler: Konfor, malzeme kalitesi, taban yapısı vb. maddeler halinde vurgula.
  - SEO: İçerikte "rahat", "ortopedik", "şık", "trend", "yeni sezon" gibi uygun anahtar kelimeleri geçir.
- **Format:** HTML etiketleri kullan (p, ul, li, strong, h3).

**2. KATEGORİ VE ÖZELLİK SEÇİMİ:**
- Görselleri ve ürün başlığını analiz et.
- **ZORUNLU:** Hem Hiyerarşik Kategoriden hem de Ürün Tipi Kategorisinden en doğru seçimi yap.
- Teknik özellikleri görselden çıkarıp listedeki değerlerle eşleştir.

**YANIT FORMATI (JSON):**
{
  "hierarchicalCategoryIds": ["ID1", "ID2"],
  "hierarchicalCategoryName": "Kategori İsmi",
  "hierarchicalCategoryReason": "Neden...",
  "productTypeCategoryId": "ID",
  "productTypeCategoryName": "İsim",
  "productTypeCategoryReason": "Neden...",
  "descriptionHtml": "<h3>Ürün Hakkında</h3><p>...</p>",
  "attributeSelections": {
    "featureId": "valueId"
  }
}

**KRİTİK KURALLAR:**
- Açıklama en az 150-200 kelime olsun.
- attributeSelections key ve value STRING olmalı.`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini", // Supports vision
            messages: [
                {
                    role: "system",
                    content: "Sen bir ürün analiz uzmanısın. Görsellerden özellikleri çıkarıp verilen listeyle eşleştirirsin. EN İYİ TAHMİNİ yapmaktan çekinme."
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
            temperature: 0.5, // Biraz daha esnek olsun
            max_tokens: 4000
        });

        const analysis = JSON.parse(completion.choices[0].message.content || "{}");
        console.log("--- AI ANALİZ SONUCU ---");
        console.log(JSON.stringify(analysis, null, 2));
        console.log("-----------------------");

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
        console.error("AI Product Analysis Error:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
