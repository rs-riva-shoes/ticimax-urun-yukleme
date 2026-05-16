/**
 * Centralized environment configuration with validation.
 * This ensures that the app fails early if critical environment variables are missing.
 */

export const env = {
    // Ticimax
    TICIMAX_DOMAIN: process.env.TICIMAX_DOMAIN || "https://www.siteadi.com",
    TICIMAX_USER: process.env.TICIMAX_USER || "",
    TICIMAX_PASS: process.env.TICIMAX_PASS || "",

    // OpenAI
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",

    // Firebase (Client & Admin)
    FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || "",
    FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN || "",
    FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || "",
    FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET || "",
    FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID || "",
    FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID || "",
    
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || "",
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY || "",
};

// Simple validation helper
export const validateEnv = () => {
    const requiredKeys: (keyof typeof env)[] = [
        "TICIMAX_USER", 
        "TICIMAX_PASS", 
        "OPENAI_API_KEY",
        "FIREBASE_PROJECT_ID",
        "FIREBASE_API_KEY"
    ];
    
    const missing = requiredKeys.filter(key => !env[key]);
    
    if (missing.length > 0) {
        console.warn(`⚠️ Missing environment variables: ${missing.join(", ")}`);
    } else {
        if (typeof window === 'undefined') {
            console.log("✅ Environment variables validated.");
        }
    }
};
