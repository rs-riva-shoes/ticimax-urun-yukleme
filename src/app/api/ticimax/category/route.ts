import { NextResponse } from "next/server";

export async function GET() {
    // In a real scenario, we would soap client.GetCategories() or similar
    // For now, returning a mock list of categories relevant to shoes/clothing
    const mockCategories = [
        { id: "101", name: "Kadın Çanta" },
        { id: "102", name: "Kadın Ayakkabı" },
        { id: "103", name: "Kadın Sandalet" },
        { id: "104", name: "Kadın Terlik" },
        { id: "105", name: "Kadın Bot" },
        { id: "106", name: "Erkek Ayakkabı" },
        { id: "107", name: "Erkek Bot" },
        { id: "108", name: "Çocuk Ayakkabı" },
        { id: "201", name: "Yeni Sezon" },
        { id: "202", name: "İndirimli Ürünler" },
    ];

    return NextResponse.json({ success: true, categories: mockCategories });
}
