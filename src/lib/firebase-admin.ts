import { initializeApp, getApps, getApp, cert, ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { getAuth } from "firebase-admin/auth";

const serviceAccount: ServiceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    // Handle private key newlines
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
};

let app;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let adminDb: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let adminStorage: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let adminAuth: any;

try {
    if (serviceAccount.projectId && serviceAccount.clientEmail && serviceAccount.privateKey) {
        app = !getApps().length
            ? initializeApp({
                credential: cert(serviceAccount),
                storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, // Optional: for admin storage access
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
                where: () => ({ get: async () => ({ empty: true, docs: [] }) }),
            }),
            batch: () => ({ set: () => { }, commit: async () => { } }),
            runTransaction: async () => { return "MOCK_SKU"; }
        };
        adminStorage = { bucket: () => ({}) };
        adminAuth = {};
    }
} catch (error) {
    console.error("Firebase Admin Init Error:", error);
}

export { adminDb, adminStorage, adminAuth };
