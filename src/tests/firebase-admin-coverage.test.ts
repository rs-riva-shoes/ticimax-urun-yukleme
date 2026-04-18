import { describe, it, expect } from 'vitest';

describe('Service Deep Scan: Firebase Admin', () => {
    
    it('should export adminDb, adminAuth and adminStorage', async () => {
        // Firebase Admin modülünü içe aktarıyoruz
        const admin = await import('@/services/firebase-admin');
        
        // Tüm servislerin tanımlı olduğunu doğrula
        expect(admin.adminDb).toBeDefined();
        expect(admin.adminAuth).toBeDefined();
        expect(admin.adminStorage).toBeDefined();
    });

    it('should handle multiple initialization attempts gracefully', async () => {
        // İkinci kez import edildiğinde (veya logic çalıştığında) 
        // getApps().length > 0 senaryosunu test eder
        const admin1 = await import('@/services/firebase-admin');
        const admin2 = await import('@/services/firebase-admin');
        
        expect(admin1.adminDb).toBe(admin2.adminDb);
    });
});
