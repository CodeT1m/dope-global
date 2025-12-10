// R2 Storage Utility
// TODO: Implement Cloudflare R2 storage methods using S3 compatible client

// src/utils/r2storage.js
import { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";

// 1. Initialize the S3 Client
const S3 = new S3Client({
    region: "auto",
    endpoint: `https://${import.meta.env.VITE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: import.meta.env.VITE_R2_ACCESS_KEY_ID,
        secretAccessKey: import.meta.env.VITE_R2_SECRET_ACCESS_KEY,
    },
});

export const uploadToR2 = async (file, folder = 'misc') => {
    // 2. Create a unique file name
    // Sanitize folder name to be safe for URLs/S3 keys, but ALLOW forward slashes for nested structure
    const safeFolder = folder.replace(/[^a-zA-Z0-9-_\./]/g, '_');
    const uniqueFileName = `${safeFolder}/${Date.now()}_${file.name.replace(/\s/g, "_")}`;

    // Convert file to ArrayBuffer to avoid 'getReader' errors in some browser envs
    const arrayBuffer = await file.arrayBuffer();

    const command = new PutObjectCommand({
        Bucket: import.meta.env.VITE_R2_BUCKET_NAME,
        Key: uniqueFileName,
        Body: new Uint8Array(arrayBuffer),
        ContentType: file.type,
    });

    try {
        // 3. Send the file
        await S3.send(command);

        // 4. Return the public URL so we can save it to Supabase later
        const publicUrl = `${import.meta.env.VITE_R2_PUBLIC_URL}/${uniqueFileName}`;
        console.log("Upload Success:", publicUrl);
        return { success: true, url: publicUrl, path: uniqueFileName };

    } catch (error) {
        console.error("R2 Upload Error:", error);
        return { success: false, error: error };
    }
};

export const deleteFolderFromR2 = async (folder) => {
    try {
        // 1. Calculate paths for both new (nested) and old (flat) structures
        // New: Events/Event Name/
        const safeFolderNew = folder.replace(/[^a-zA-Z0-9-_\./]/g, '_');
        // Old: Events_Event Name/
        const safeFolderOld = folder.replace(/[^a-zA-Z0-9-_\.]/g, '_');

        const pathsToCheck = [safeFolderNew, safeFolderOld];
        // Remove duplicates if paths are identical
        const uniquePaths = [...new Set(pathsToCheck)];

        for (const path of uniquePaths) {
            // 2. List objects with specific prefix
            const listCommand = new ListObjectsV2Command({
                Bucket: import.meta.env.VITE_R2_BUCKET_NAME,
                Prefix: `${path}/` // Ensure we only delete contents of the folder
            });

            const listResponse = await S3.send(listCommand);

            if (listResponse.Contents && listResponse.Contents.length > 0) {
                // 3. Delete the objects
                const deleteCommand = new DeleteObjectsCommand({
                    Bucket: import.meta.env.VITE_R2_BUCKET_NAME,
                    Delete: {
                        Objects: listResponse.Contents.map(item => ({ Key: item.Key })),
                        Quiet: false
                    }
                });

                await S3.send(deleteCommand);
                console.log(`Deleted objects in ${path}`);
            }
        }

        return { success: true };

    } catch (error) {
        console.error("R2 Delete Error:", error);
        return { success: false, error: error };
    }
};