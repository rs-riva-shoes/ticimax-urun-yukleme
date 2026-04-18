// adminDb import removed as it was unused

// Not: script olduğu için fetch'i node-fetch veya global fetch üzerinden simüle edeceğiz.
// Ama en sağlıklısı doğrudan API route'umuzu tetikleyen bir internal test yazmak.

async function runLiveTest() {
    console.log("🚀 Canlı Ticimax Testi Başlıyor...");
    
    // Test Ürün Verisi
    const testProduct = {
        title: "ANTIGRAVITY TEST ÜRÜNÜ - SİLMEYİN",
        productCode: "TEST-" + Math.floor(Math.random() * 10000),
        descriptionHtml: "<p>Bu bir sistem test ürünüdür. AI tarafından oluşturulmuştur.</p>",
        categoryId: "102", // Kadın Ayakkabı (Örnek)
        brandId: "1",      // Örnek Marka
        price: {
            purchase: 100,
            sale: 500,
            discount: 450
        },
        variants: [
            { size: "38", color: "Siyah", qty: 10, barcode: "TEST-BARKOD-1" }
        ]
    };

    console.log("📦 Test Verisi Hazır:", testProduct.productCode);

    try {
        // API Route'u simüle ederek ticimax/push endpointine gidebiliriz 
        // veya doğrudan soap servisini tetikleyen fonksiyonu buraya çağırabiliriz.
        // Güvenli tarafta kalmak için lokal sunucunuza (port 3000) bir POST isteği atalım.
        
        const response = await fetch("http://localhost:3000/api/ticimax/push", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(testProduct)
        });

        const result = await response.json();

        if (result.success) {
            console.log("✅ BAŞARILI! Ürün Ticimax'a gönderildi.");
            console.log("🔗 Ticimax Cevabı:", result.message || "İşlem Tamam.");
        } else {
            console.log("❌ HATA ALINDI!");
            console.log("Detay:", result.error || result.message);
        }
    } catch (error) {
        console.error("💥 Bağlantı Hatası:", error);
    }
}

runLiveTest();
