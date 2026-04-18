import { initializeApp, getApps, getApp, cert, ServiceAccount } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getStorage, Storage } from "firebase-admin/storage";
import { getAuth, Auth } from "firebase-admin/auth";
import { env } from "@/config/env";

const serviceAccount: ServiceAccount = {
    projectId: env.FIREBASE_PROJECT_ID,
    clientEmail: env.FIREBASE_CLIENT_EMAIL,
    // Handle private key newlines
    privateKey: env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
};

let app;
let adminDb: Firestore;
let adminStorage: Storage;
let adminAuth: Auth;

try {
    if (serviceAccount.projectId && serviceAccount.clientEmail && serviceAccount.privateKey) {
        app = !getApps().length
            ? initializeApp({
                credential: cert(serviceAccount),
                storageBucket: env.FIREBASE_STORAGE_BUCKET, // Optional: for admin storage access
            })
            : getApp();

        adminDb = getFirestore(app);
        adminStorage = getStorage(app);
        adminAuth = getAuth(app);
    } else {
        console.warn("Firebase Admin Credentials missing. Using mock/disabled mode.");
        // Mock db to prevent crash on page load
        adminDb = {
            collection: () => ({
                get: async () => ({ docs: [] }), // return empty list
                doc: () => ({
                    get: async () => ({ exists: false, data: () => ({}) }),
                    set: async () => { },
                    update: async () => { }
                }),
                where: () => ({ 
                    get: async () => ({ empty: true, docs: [] }),
                    count: () => ({ get: async () => ({ data: () => ({ count: 0 }) }) })
                }),
                count: () => ({ get: async () => ({ data: () => ({ count: 0 }) }) })
            }),
            batch: () => ({ set: () => { }, commit: async () => { } }),
            runTransaction: async () => { return "MOCK_SKU"; }
        } as unknown as Firestore;
        adminStorage = { bucket: () => ({}) } as unknown as Storage;
        adminAuth = {} as unknown as Auth;
    }
} catch (error) {
    console.error("Firebase Admin Init Error:", error);
}

export { adminDb, adminStorage, adminAuth };
