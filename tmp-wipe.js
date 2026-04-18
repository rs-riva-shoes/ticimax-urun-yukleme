const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env.local') });

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        })
    });
}
const db = admin.firestore();

async function run() {
    const snapshot = await db.collection("products").get();
    let count = 0;
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
        count++;
    });
    if (count > 0) {
        await batch.commit();
        console.log(`✅ ${count} ürün başarıyla silindi.`);
    } else {
        console.log("Firebase de silinecek ürün yok.");
    }
}
run();
