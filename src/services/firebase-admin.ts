import { initializeApp, getApps, getApp, cert, ServiceAccount } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getStorage, Storage } from "firebase-admin/storage";
import { getAuth, Auth } from "firebase-admin/auth";
import { env } from "@/config/env";

export const createMockFirestore = (): Firestore => {
    const mockQuery = {
        get: async () => ({ docs: [], data: () => ({ count: 0 }) }),
        where: () => mockQuery,
        orderBy: () => mockQuery,
        limit: () => mockQuery,
        count: () => ({ get: async () => ({ data: () => ({ count: 0 }) }) })
    };

    return {
        collection: () => ({
            ...mockQuery,
            doc: () => ({
                get: async () => ({ exists: false, data: () => ({}) }),
                set: async () => { },
                update: async () => { }
            }),
        }),
        batch: () => ({ set: () => { }, commit: async () => { } }),
        runTransaction: async () => { return "MOCK_SKU"; }
    } as unknown as Firestore;
};

export interface FirebaseConfig {
    projectId: string;
    clientEmail: string;
    privateKey: string;
    storageBucket?: string;
}

export const getFirebaseServices = (configOverride?: FirebaseConfig) => {
    const serviceAccount: ServiceAccount = {
        projectId: configOverride ? configOverride.projectId : env.FIREBASE_PROJECT_ID,
        clientEmail: configOverride ? configOverride.clientEmail : env.FIREBASE_CLIENT_EMAIL,
        privateKey: (configOverride ? configOverride.privateKey : env.FIREBASE_PRIVATE_KEY)?.replace(/\\n/g, "\n"),
    };

    let app;
    let db: Firestore;
    let storage: Storage;
    let auth: Auth;

    try {
        if (serviceAccount.projectId && serviceAccount.clientEmail && serviceAccount.privateKey) {
            app = !getApps().length
                ? initializeApp({
                    credential: cert(serviceAccount),
                    storageBucket: configOverride?.storageBucket || env.FIREBASE_STORAGE_BUCKET,
                })
                : getApp();

            db = getFirestore(app);
            storage = getStorage(app);
            auth = getAuth(app);
        } else {
            if (typeof window === 'undefined' || process.env.NODE_ENV === 'test') {
                console.warn("Firebase Admin Credentials missing. Using mock/disabled mode.");
            }
            db = createMockFirestore();
            storage = { bucket: () => ({}) } as unknown as Storage;
            auth = {} as unknown as Auth;
        }
    } catch (error) {
        if (typeof window === 'undefined' || process.env.NODE_ENV === 'test') {
            console.error("Firebase Admin Init Error:", error);
        }
        db = createMockFirestore();
        storage = { bucket: () => ({}) } as unknown as Storage;
        auth = {} as unknown as Auth;
    }

    return { db, storage, auth };
};

// Singleton initialization
const services = getFirebaseServices();
export const adminDb = services.db;
export const adminStorage = services.storage;
export const adminAuth = services.auth;
