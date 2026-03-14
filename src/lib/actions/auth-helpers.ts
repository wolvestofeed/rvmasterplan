"use server";

import { db } from "@/lib/db";
import { rvVehicles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

/** Returns the active user ID, falling back to "demo_user" for unauthenticated visitors. */
export async function getActiveUserId() {
    const { userId } = await auth();
    return userId || "demo_user";
}

/** Returns true if the current user is a demo or guest user (read-only). */
export async function isReadOnly() {
    const { userId } = await auth();
    return !userId || userId === "demo_user" || userId.startsWith("guest_");
}

/** Guards write operations. Returns the authenticated userId or throws. */
export async function requireAuth() {
    const { userId } = await auth();
    if (!userId || userId === "demo_user" || userId.startsWith("guest_")) {
        throw new Error("Saving is disabled in Demo Mode.");
    }
    return userId;
}

/** Returns { rvId, isDemo } for the current user's first RV vehicle. */
export async function getRvId() {
    const activeId = await getActiveUserId();
    const rv = await db.query.rvVehicles.findFirst({
        where: eq(rvVehicles.userId, activeId),
    });
    return { rvId: rv?.id, isDemo: activeId === "demo_user" };
}
