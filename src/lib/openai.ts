import OpenAI from "openai";

const getOpenAIClient = () => {
    const apiKey = process.env.OPENAI_API_KEY || process.env.APP_OPENAI_API_KEY;
    
    if (!apiKey) {
        if (process.env.NODE_ENV === "development") {
            console.warn("⚠️ OpenAI API Key bulunamadı! .env.local dosyasını kontrol edin.");
        }
        return null;
    }
    
    // Sadece sunucu tarafında ve uygulama başlarken bir kez görelim
    if (typeof window === 'undefined') {
        console.log(`✅ OpenAI anahtarı yüklendi: ${apiKey.substring(0, 10)}...`);
    }
    
    return new OpenAI({ apiKey });
};

export const openai = getOpenAIClient() as OpenAI;

