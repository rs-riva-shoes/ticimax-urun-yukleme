import OpenAI from "openai";

export const openai = new OpenAI({
    apiKey: process.env.APP_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
});

if (!process.env.APP_OPENAI_API_KEY && !process.env.OPENAI_API_KEY) {
    console.error("❌ APP_OPENAI_API_KEY or OPENAI_API_KEY is missing!");
} else {
    // Prefer APP_ key for logging check
    const key = process.env.APP_OPENAI_API_KEY || process.env.OPENAI_API_KEY || "";
    console.log("✅ OpenAI API Key loaded from " + (process.env.APP_OPENAI_API_KEY ? "APP_VAR" : "SYS_VAR"));
    console.log("✅ Key Start:", key.substring(0, 10) + "...");
}
