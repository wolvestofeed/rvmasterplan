import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { auth } from "@clerk/nextjs/server";

const f = createUploadthing();

export const ourFileRouter = {
    heroImageUploader: f({ image: { maxFileSize: "2MB", maxFileCount: 1 } })
        .middleware(async ({ req }) => {
            const { userId } = await auth();
            if (!userId) throw new UploadThingError("Unauthorized");
            if (userId === "demo_user" || userId.startsWith("guest_")) {
                throw new UploadThingError("View-only mode restrictions apply");
            }
            return { userId };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            console.log("Upload complete for userId:", metadata.userId);
            console.log("file url", file.url);
            return { uploadedBy: metadata.userId, url: file.url };
        }),

    documentUploader: f({ pdf: { maxFileSize: "4MB", maxFileCount: 1 }, image: { maxFileSize: "2MB", maxFileCount: 1 } })
        .middleware(async ({ req }) => {
            const { userId } = await auth();
            if (!userId) throw new UploadThingError("Unauthorized");
            if (userId === "demo_user" || userId.startsWith("guest_")) {
                throw new UploadThingError("View-only mode restrictions apply");
            }
            return { userId };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            console.log("Doc Upload complete for userId:", metadata.userId);
            return { uploadedBy: metadata.userId, url: file.url };
        }),
    receiptUploader: f({ image: { maxFileSize: "1MB", maxFileCount: 1 } })
        .middleware(async ({ req }) => {
            const { userId } = await auth();
            if (!userId) throw new UploadThingError("Unauthorized");
            if (userId === "demo_user" || userId.startsWith("guest_")) {
                throw new UploadThingError("View-only mode restrictions apply");
            }
            return { userId };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            console.log("Receipt upload complete for userId:", metadata.userId);
            return { uploadedBy: metadata.userId, url: file.url };
        }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
