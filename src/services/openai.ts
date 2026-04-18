import OpenAI from "openai";
import { env } from "@/config/env";

const getOpenAIClient = () => {
    const apiKey = env.OPENAI_API_KEY;
    
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
