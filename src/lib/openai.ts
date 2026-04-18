import OpenAI from "openai";

const apiKey = process.env.APP_OPENAI_API_KEY || process.env.OPENAI_API_KEY;

if (!apiKey) {
    console.error("❌ OpenAI API Key eksik! APP_OPENAI_API_KEY veya OPENAI_API_KEY tanımlayın.");
}

export const openai = new OpenAI({ apiKey });

