"use server";

import { db } from "@/lib/db";
import { userProfiles } from "@/lib/db/schema";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { getActiveUserId, requireAuth } from "@/lib/actions/auth-helpers";
import { getCachedDemoProfile } from "@/lib/actions/demo-cache";

export async function getUserProfile() {
    try {
        const activeId = await getActiveUserId();
        if (activeId === "demo_user" || activeId.startsWith("guest_")) return getCachedDemoProfile();

        let profile = await db.query.userProfiles.findFirst({
            where: eq(userProfiles.userId, activeId)
        });

        if (!profile) {
            const defaultDate = new Date();
            defaultDate.setDate(defaultDate.getDate() + 30);

            const newProfiles = await db.insert(userProfiles).values({
                id: randomUUID(),
                userId: activeId,
                subscriptionStatus: 'active',
                subscriptionRenewalDate: defaultDate
            }).returning();
            profile = newProfiles[0];
        }

        return { success: true, data: profile };
    } catch (error) {
        console.error("Error fetching user profile:", error);
        return { success: false, error: "Failed to fetch user profile" };
    }
}

export async function extendSubscription() {
    try {
        const activeId = await requireAuth();

        const res = await getUserProfile();
        if (res.success && res.data) {
            const current = res.data.subscriptionRenewalDate ? new Date(res.data.subscriptionRenewalDate) : new Date();
            current.setFullYear(current.getFullYear() + 1);

            await db.update(userProfiles)
                .set({ subscriptionRenewalDate: current, subscriptionStatus: 'active' })
                .where(eq(userProfiles.userId, activeId));

            revalidatePath("/settings");
            revalidatePath("/dashboard");
            return { success: true, date: current };
        }
        return { success: false };
    } catch (error) {
        console.error("Error extending subscription:", error);
        return { success: false, error: "Failed to extend" };
    }
}

export async function updateDashboardHeroImage(imageUrl: string) {
    try {
        const activeId = await requireAuth();

        await db.update(userProfiles)
            .set({
                dashboardHeroImage: imageUrl,
                updatedAt: new Date()
            })
            .where(eq(userProfiles.userId, activeId));

        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Error updating dashboard hero image:", error);
        return { success: false, error: "Failed to update dashboard hero image" };
    }
}
