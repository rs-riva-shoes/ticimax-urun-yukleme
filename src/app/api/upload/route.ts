import { NextResponse } from "next/server";
import { adminStorage } from "@/lib/firebase-admin";

export async function POST(req: Request) {
    try {
        const { image, folder = "products" } = await req.json();

        if (!image) {
            return NextResponse.json({ error: "No image provided" }, { status: 400 });
        }

        // Extract base64 data
        // Format: "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
        const match = image.match(/^data:(.+);base64,(.+)$/);
        if (!match) {
            return NextResponse.json({ error: "Invalid image format" }, { status: 400 });
        }

        const mimeType = match[1];
        const base64Data = match[2];
        const buffer = Buffer.from(base64Data, "base64");

        const extension = mimeType.split("/")[1] || "jpg";
        const filename = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;

        const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
        const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

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
