import { describe, it, expect, vi } from 'vitest';

// Mock Firebase
vi.mock('firebase/app', () => ({
    initializeApp: vi.fn(),
    getApps: vi.fn(() => []),
    getApp: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
    getAuth: vi.fn(() => ({})),
}));

vi.mock('firebase/firestore', () => ({
    getFirestore: vi.fn(() => ({})),
}));

vi.mock('firebase/storage', () => ({
    getStorage: vi.fn(() => ({})),
}));

// Import after mock
import { db, auth, storage } from '@/services/firebase-client';

describe('Firebase Client Service', () => {
    it('should initialize firestore', () => {
        expect(db).toBeDefined();
    });

    it('should initialize auth', () => {
        expect(auth).toBeDefined();
    });

    it('should initialize storage', () => {
        expect(storage).toBeDefined();
    });
});
