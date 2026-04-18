import { describe, it, expect, vi } from 'vitest';

// Firebase-admin paketini en kaba haliyle mock'layarak
// sadece bizim servis dosyamızın (firebase-admin.ts) hata almadan yüklenmesini sağlıyoruz.
vi.mock('firebase-admin', () => ({
    default: {
        initializeApp: vi.fn(),
        credential: {
            cert: vi.fn(() => ({})),
        },
        firestore: vi.fn(() => ({})),
        auth: vi.fn(() => ({})),
        storage: vi.fn(() => ({
            bucket: vi.fn(() => ({})),
        })),
    },
    apps: []
}));

describe('Service: Firebase Admin Initialization (Safe Mock)', () => {
    it('should load the service without PEM errors', async () => {
        const adminService = await import('@/services/firebase-admin');
        expect(adminService.adminDb).toBeDefined();
    });
});
