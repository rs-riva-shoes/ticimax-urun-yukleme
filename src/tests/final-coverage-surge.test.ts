import { describe, it, expect, vi, beforeEach } from 'vitest';

// 0. Environment Mock (Vital for route validation)
vi.mock('@/config/env', () => ({
    env: {
        TICIMAX_DOMAIN: 'https://test.com',
        TICIMAX_USER: 'test-user',
        TICIMAX_PASS: 'test-pass'
    },
    validateEnv: vi.fn()
}));

// 1. Bulletproof Firebase Mock (Inside factory for guaranteed hoisting safety)
vi.mock('firebase-admin/app', () => ({
    getApp: vi.fn(() => ({})),
    initializeApp: vi.fn(),
    cert: vi.fn()
}));

vi.mock('firebase-admin/firestore', () => {
    const mockDoc = {
        get: vi.fn().mockResolvedValue({ exists: true, data: () => ({}) }),
        set: vi.fn().mockResolvedValue({}),
        update: vi.fn().mockResolvedValue({}),
    };
    const mockCollection = {
        doc: vi.fn(() => mockDoc),
        where: vi.fn(() => ({
            get: vi.fn().mockResolvedValue({ empty: false, docs: [{ ref: mockDoc }] })
        })),
        get: vi.fn().mockResolvedValue({ docs: [] })
    };
    const mockDb = {
        collection: vi.fn(() => mockCollection),
        batch: vi.fn(() => ({
            update: vi.fn(),
            set: vi.fn(),
            commit: vi.fn().mockResolvedValue({})
        }))
    };
    return { getFirestore: vi.fn(() => mockDb) };
});

vi.mock('firebase-admin/auth', () => ({ getAuth: vi.fn(() => ({})) }));
vi.mock('firebase-admin/storage', () => ({ getStorage: vi.fn(() => ({ bucket: vi.fn() })) }));

describe('Final Coverage Surge: Hitting the 80% Mark', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        // Global fetch mock with basic safety
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            text: () => Promise.resolve('<Empty>Test</Empty>')
        });
    });

    it('Firebase Admin: Initialization Branch Coverage', async () => {
        const admin = await import('@/services/firebase-admin');
        expect(admin.adminDb).toBeDefined();
    });

    it('Attributes Sync: Complex Branch Coverage', async () => {
        const { POST } = await import('@/app/api/settings/attributes/sync/route');
        
        // Two calls in this route: SelectTeknikDetayOzellik and SelectTeknikDetayDeger
        global.fetch = vi.fn()
            .mockResolvedValue({
                ok: true,
                status: 200,
                text: () => Promise.resolve('<TeknikDetayOzellik><ID>101</ID><Tanim>Renk</Tanim><GrupID>1</GrupID></TeknikDetayOzellik><TeknikDetayDeger><ID>501</ID><Tanim>Kirmizi</Tanim><OzellikID>101</OzellikID></TeknikDetayDeger>')
            });

        const res = await POST();
        const data = await res.json();
        
        if (res.status !== 200) console.log('DEBUG ATTR SYNC ERROR:', data);
        
        expect(res.status).toBe(200);
        expect(data.success).toBe(true);
    });

    it('Products Sync: Error and Empty Paths', async () => {
        const { POST } = await import('@/app/api/settings/products/sync/route');
        
        // 1. Network Fail
        global.fetch = vi.fn().mockRejectedValue(new Error('Network Fail'));
        const res = await POST();
        expect(res.status).toBe(500);

        // 2. Empty Response (Should be 400 because products.length === 0)
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            text: () => Promise.resolve('<Raw>Empty</Raw>')
        });
        const res2 = await POST();
        const data2 = await res2.json();
        
        if (res2.status !== 400) console.log('DEBUG PROD SYNC ERROR:', data2);
        
        expect(res2.status).toBe(400); 
    });
});
