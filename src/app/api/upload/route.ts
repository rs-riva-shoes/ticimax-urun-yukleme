import { NextResponse } from "next/server";
import { adminStorage } from "@/services/firebase-admin";
import { env } from "@/config/env";

export async function POST(req: Request) {
    try {
        const { image, folder = "products" } = await req.json();

        if (!image) {
            return NextResponse.json({ error: "No image provided" }, { status: 400 });
        }

        // Extract base64 data
        const match = image.match(/^data:(.+);base64,(.+)$/);
        if (!match) {
            return NextResponse.json({ error: "Invalid image format" }, { status: 400 });
        }

        const mimeType = match[1];
        const base64Data = match[2];
        const buffer = Buffer.from(base64Data, "base64");

        // MIME type validation
        const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
        if (!allowedMimeTypes.includes(mimeType)) {
            return NextResponse.json(
                { error: `Desteklenmeyen dosya türü: ${mimeType}. Sadece JPG, PNG, WebP kabul edilir.` },
                { status: 400 }
            );
        }

        // File size validation (10MB max)
        const maxSize = 10 * 1024 * 1024;
        if (buffer.length > maxSize) {
            return NextResponse.json(
                { error: `Dosya çok büyük (${(buffer.length / 1024 / 1024).toFixed(1)}MB). Maksimum 10MB kabul edilir.` },
                { status: 400 }
            );
        }

        const extension = mimeType.split("/")[1] || "jpg";
        const filename = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;


        const bucketName = env.FIREBASE_STORAGE_BUCKET;
        const projectId = env.FIREBASE_PROJECT_ID;

        console.log(`[Upload] Configured Bucket: ${bucketName}`);
        console.log(`[Upload] Project ID: ${projectId}`);

        let fileRef;
        let usedBucketName = bucketName;

        try {
            if (!bucketName) throw new Error("No bucket configured");

            // Use the configured bucket name directly
            const bucket = adminStorage.bucket(bucketName);
            fileRef = bucket.file(filename);

        } catch (e) {
            console.warn("Bucket setup warning:", e);
        }

        // Final check
        if (!fileRef) {
            // Fallback to project ID based
            if (projectId) {
                usedBucketName = `${projectId}.appspot.com`;
                fileRef = adminStorage.bucket(usedBucketName).file(filename);
            } else {
                throw new Error("Could not determine storage bucket");
            }
        }

        console.log(`[Upload] Using bucket: ${usedBucketName}`);
        console.log(`[Upload] Uploading file: ${filename}`);

        await fileRef.save(buffer, {
            metadata: {
                contentType: mimeType,
            },
            public: true,
        });

        // The URL depends on which domain works. "storage.googleapis.com" works for both if the bucket name is correct.
        const publicUrl = `https://storage.googleapis.com/${usedBucketName}/${filename}`;

        return NextResponse.json({
            success: true,
            url: publicUrl
        });

    } catch (error: unknown) {
        console.error("Server Upload Error:", error);
        return NextResponse.json(
            { error: "Upload failed", details: (error as Error).message },
            { status: 500 }
        );
    }
}
