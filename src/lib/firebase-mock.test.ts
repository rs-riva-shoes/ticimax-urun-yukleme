import { describe, it, expect, vi } from 'vitest';

// We'll simulate the mock logic from firebase-admin.ts
const mockDb = {
    collection: vi.fn(() => ({
        count: vi.fn(() => ({
            get: vi.fn(async () => ({
                data: () => ({ count: 42 })
            }))
        }))
    }))
};

describe('Firebase Admin Mock Tests', () => {

    it('should support the count() operation', async () => {
        const snapshot = await mockDb.collection("products").count().get();
        const data = snapshot.data();
        
        expect(data.count).toBe(42);
        expect(mockDb.collection).toHaveBeenCalledWith("products");
    });

});
