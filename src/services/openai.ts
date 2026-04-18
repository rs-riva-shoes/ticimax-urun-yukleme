import OpenAI from "openai";
import { env } from "@/config/env";

export const createOpenAIClient = (apiKeyOverride?: string) => {
    const apiKey = apiKeyOverride !== undefined ? apiKeyOverride : env.OPENAI_API_KEY;
    
    if (!apiKey) {
        if (process.env.NODE_ENV === "development") {
            console.warn("⚠️ OpenAI API Key bulunamadı! .env.local dosyasını kontrol edin.");
        }
        return null;
    }
    
    if (typeof window === 'undefined' || process.env.NODE_ENV === 'test') {
        console.log(`✅ OpenAI anahtarı yüklendi: ${apiKey.substring(0, 10)}...`);
    }
    
    return new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
};

export const openai = createOpenAIClient() as OpenAI;
