import { NextResponse } from "next/server";
import { openai } from "@/lib/openai";

interface Category {
    id: string;
    name: string;
}

export async function POST(req: Request) {
    try {
        const { title, categories } = await req.json();

        if (!title) {
            return NextResponse.json({ error: "title is required" }, { status: 400 });
        }

        if (!categories || categories.length === 0) {
            return NextResponse.json({ error: "categories list is required" }, { status: 400 });
        }

        // Create a list of categories for AI to choose from
        const categoryList = categories.map((c: Category) => `ID: ${c.id} - ${c.name}`).join("\n");

        const prompt = `Bir e-ticaret ürünü için en uygun kategoriyi seç.

Ürün Adı: ${title}

Mevcut Kategoriler:
${categoryList}

Sadece kategori ID'sini döndür. Yanıt formatı:
{
  "categoryId": "seçilen kategori ID'si",
  "reason": "kısa açıklama (Türkçe)"
}`;

        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: "Sen bir e-ticaret ürün kategorilendirme uzmanısın. Ürün adına göre en uygun kategoriyi seçiyorsun." },
                { role: "user", content: prompt }
            ],
            model: "gpt-4o-mini",
            response_format: { type: "json_object" },
            temperature: 0.3, // Lower temperature for more consistent predictions
        });

        const content = JSON.parse(completion.choices[0].message.content || "{}");

        // Validate that the returned categoryId exists in the provided list
        const selectedCategory = categories.find((c: Category) => c.id === content.categoryId);

        if (!selectedCategory) {
            // Fallback to first category if AI returns invalid ID
            return NextResponse.json({
                success: true,
                categoryId: categories[0].id,
                categoryName: categories[0].name,
                reason: "AI tahmini başarısız oldu, ilk kategori seçildi.",
                fallback: true
            });
        }

        return NextResponse.json({
            success: true,
            categoryId: content.categoryId,
            categoryName: selectedCategory.name,
            reason: content.reason || "AI tarafından seçildi",
            fallback: false
        });

    } catch (error: unknown) {
        console.error("AI Category Prediction Error:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
