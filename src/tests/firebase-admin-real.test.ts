import { describe, it, expect, vi, beforeEach } from 'vitest';

// 1. Hoist the mocks so they are available to vi.mock
const mocks = vi.hoisted(() => ({
    getApps: vi.fn(),
    initializeApp: vi.fn(),
    getApp: vi.fn(),
    cert: vi.fn(),
    getFirestore: vi.fn(),
    getStorage: vi.fn(),
    getAuth: vi.fn()
}));

// 2. Mock the modules using the hoisted mocks
vi.mock('firebase-admin/app', () => ({
    getApps: mocks.getApps,
    initializeApp: mocks.initializeApp,
    getApp: mocks.getApp,
    cert: mocks.cert
}));

vi.mock('firebase-admin/firestore', () => ({ getFirestore: mocks.getFirestore }));
vi.mock('firebase-admin/storage', () => ({ getStorage: mocks.getStorage }));
vi.mock('firebase-admin/auth', () => ({ getAuth: mocks.getAuth }));

// 3. Import the service (this will use the mocks)
import { getFirebaseServices } from '@/services/firebase-admin';

describe('Firebase Admin: Complete Function Coverage', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('Scenario 1: Fresh Initialization', () => {
        mocks.getApps.mockReturnValue([]);
        mocks.initializeApp.mockReturnValue({ name: 'new' });
        mocks.getFirestore.mockReturnValue({ name: 'db-new' });

        const services = getFirebaseServices({ 
            projectId: 'p', clientEmail: 'e', privateKey: 'k' 
        });
        
        expect(mocks.initializeApp).toHaveBeenCalled();
        expect(services.db).toBeDefined();
    });

    it('Scenario 2: Reuse Existing App', () => {
        mocks.getApps.mockReturnValue([{ name: 'existing' }]);
        mocks.getApp.mockReturnValue({ name: 'existing' });

        const services = getFirebaseServices({ 
            projectId: 'p', clientEmail: 'e', privateKey: 'k' 
        });
        
        expect(mocks.getApp).toHaveBeenCalled();
        expect(services.db).toBeDefined();
    });

    it('Scenario 3: Mock Mode Fallback - Full Function Scan', async () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const services = getFirebaseServices({ projectId: '', clientEmail: '', privateKey: '' });
        
        expect(services.db).toBeDefined();
        
        // --- TRIGGER ALL FUNCTIONS IN createMockFirestore ---
        const col = services.db.collection('test');
        await col.get();
        
        const doc = col.doc('d');
        const docSnap = await doc.get();
        docSnap.data(); // Trigger data() func
        await doc.set({} as any);
        await doc.update({} as any);
        
        const q = col.where('f', '==', 'v');
        await q.get();
        const qCountRes = await q.count().get();
        qCountRes.data(); // Trigger nested count data() func
        
        const colCountRes = await col.count().get();
        colCountRes.data(); // Trigger top-level count data() func
        
        const batch = services.db.batch();
        batch.set({} as any, {});
        await batch.commit();
        
        const tx = await services.db.runTransaction(async () => { return "TRANSACTION_RUN"; });
        expect(tx).toBe("MOCK_SKU"); // Original code returns "MOCK_SKU" directly
        
        expect(services.storage.bucket()).toBeDefined();
        
        expect(warnSpy).toHaveBeenCalled();
        warnSpy.mockRestore();
    });

    it('Scenario 4: Crash Safety', () => {
        mocks.getApps.mockImplementation(() => { throw new Error("CATASTROPHIC") });
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        
        const services = getFirebaseServices({ projectId: 'p', clientEmail: 'e', privateKey: 'k' });
        
        expect(errorSpy).toHaveBeenCalled();
        expect(services.db).toBeDefined();
        errorSpy.mockRestore();
    });
});
