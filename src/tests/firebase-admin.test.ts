import { describe, it, expect, vi } from 'vitest';
import { adminDb } from '@/services/firebase-admin';

describe('Firebase Admin Service', () => {
    it('should initialize adminDb', () => {
        expect(adminDb).toBeDefined();
        // Since it's mocked in the actual file when env is missing, 
        // we can check if it has the basic methods
        expect(typeof adminDb.collection).toBe('function');
    });

    it('should return mock data when env is missing', async () => {
        const snapshot = await adminDb.collection('test').get();
        expect(snapshot.docs).toEqual([]);
    });

    it('should have a working runTransaction mock', async () => {
        const result = await adminDb.runTransaction(async () => {});
        expect(result).toBe("MOCK_SKU");
    });
});
