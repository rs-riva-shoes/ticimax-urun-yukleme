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
      You are an expert e-commerce copywriter for a Turkish fashion/retail site (Ticimax).
      Generate professional product content for:
      Title: ${title}
      Brand: ${brand}
      Category: ${categoryName}
      
      Output strict JSON format with keys:
      - descriptionHtml: (HTML string, use <p>, <ul>, <li>, <strong>, avoid <h1>/<h2>, make it SEO friendly and rich)
      - bulletPoints: (Array of strings, 3-5 key features)
      - technicalDetails: (Array of { label: string, value: string } pairs, e.g. [{"label": "Materyal", "value": "%100 Pamuk"}])
      - keywords: (Array of strings, 10 SEO keywords)
      
      Language: Turkish.
      Tone: Professional, persuasive, SEO-optimized.
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
