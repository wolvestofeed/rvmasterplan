"use server";

import { db } from "@/lib/db";
import { documents, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Temporary fallback userId for demo mode if full auth isn't wired up to database yet
const FALLBACK_USER_ID = "guest_user";

export async function getDocuments() {
    try {
        // Ensure the dummy guest user exists so foreign keys don't fail
        await ensureGuestUser();

        const results = await db.query.documents.findMany({
            where: eq(documents.userId, FALLBACK_USER_ID),
            orderBy: [desc(documents.createdAt)]
        });

        return { success: true, data: results };
    } catch (error) {
        console.error("Error fetching documents:", error);
        return { success: false, error: "Failed to fetch documents" };
    }
}

export async function addDocument(data: {
    title: string;
    fileType: string;
    fileUrl: string;
    renewalDate?: Date | null;
    renewalCost?: string | null;
}) {
    try {
        await ensureGuestUser();

        // Convert "10.50" string to numeric string for Postgres "numeric" column
        const costStr = data.renewalCost ? parseFloat(data.renewalCost).toString() : null;

        const newDoc = await db.insert(documents).values({
            id: Math.random().toString(36).substring(2, 10),
            userId: FALLBACK_USER_ID,
            title: data.title,
            fileType: data.fileType,
            fileUrl: data.fileUrl,
            renewalDate: data.renewalDate || null,
            renewalCost: costStr
        }).returning();

        revalidatePath("/documents");
        return { success: true, data: newDoc[0] };
    } catch (error) {
        console.error("Error adding document:", error);
        return { success: false, error: "Failed to add document" };
    }
}

export async function deleteDocument(id: string) {
    try {
        await db.delete(documents).where(eq(documents.id, id));
        revalidatePath("/documents");
        return { success: true };
    } catch (error) {
        console.error("Error deleting document:", error);
        return { success: false, error: "Failed to delete document" };
    }
}


// --- Utility for Demo Mode ---
async function ensureGuestUser() {
    const existing = await db.query.users.findFirst({
        where: eq(users.id, FALLBACK_USER_ID)
    });

    if (!existing) {
        await db.insert(users).values({
            id: FALLBACK_USER_ID,
            email: "guest@rvmasterplan.com"
        });
    }
}
