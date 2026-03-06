"use server";

import { db } from "@/lib/db";
import { documents, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

export async function getDocuments() {
    try {
        const { userId } = await auth();
        const activeId = userId || "demo_user";

        const results = await db.query.documents.findMany({
            where: eq(documents.userId, activeId),
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
        const { userId } = await auth();
        const activeId = userId || "demo_user";
        if (!userId || activeId === "demo_user") {
            return { success: false, error: "Saving is disabled in Demo Mode." };
        }

        // Convert "10.50" string to numeric string for Postgres "numeric" column
        const costStr = data.renewalCost ? parseFloat(data.renewalCost).toString() : null;

        const newDoc = await db.insert(documents).values({
            id: Math.random().toString(36).substring(2, 10),
            userId: activeId,
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
        const { userId } = await auth();
        if (!userId || userId === "demo_user") {
            return { success: false, error: "Saving is disabled in Demo Mode." };
        }

        await db.delete(documents).where(eq(documents.id, id));
        revalidatePath("/documents");
        return { success: true };
    } catch (error) {
        console.error("Error deleting document:", error);
        return { success: false, error: "Failed to delete document" };
    }
}

export async function updateDocument(id: string, data: {
    title: string;
    renewalDate?: Date | null;
    renewalCost?: string | null;
}) {
    try {
        const { userId } = await auth();
        if (!userId || userId === "demo_user") {
            return { success: false, error: "Saving is disabled in Demo Mode." };
        }

        const costStr = data.renewalCost ? parseFloat(data.renewalCost).toString() : null;

        await db.update(documents).set({
            title: data.title,
            renewalDate: data.renewalDate || null,
            renewalCost: costStr
        }).where(eq(documents.id, id));

        revalidatePath("/documents");
        return { success: true };
    } catch (error) {
        console.error("Error updating document:", error);
        return { success: false, error: "Failed to update document" };
    }
}

