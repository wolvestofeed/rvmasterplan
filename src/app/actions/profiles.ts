"use server";

import { db } from "@/lib/db";
import { userProfiles, users } from "@/lib/db/schema";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

export async function getUserProfile() {
    try {
        const { userId } = await auth();
        const activeId = userId || "demo_user";

        // Fetch or create profile
        let profile = await db.query.userProfiles.findFirst({
            where: eq(userProfiles.userId, activeId)
        });

        if (!profile) {
            // Give them a default active subscription 30 days from now
            const defaultDate = new Date();
            defaultDate.setDate(defaultDate.getDate() + 30);

            const newProfiles = await db.insert(userProfiles).values({
                id: Math.random().toString(36).substring(2, 10),
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
        const { userId } = await auth();
        const activeId = userId || "demo_user";
        if (!userId || activeId === "demo_user") {
            return { success: false, error: "Subscriptions disabled in Demo Mode." };
        }

        const res = await getUserProfile();
        if (res.success && res.data) {
            const current = res.data.subscriptionRenewalDate ? new Date(res.data.subscriptionRenewalDate) : new Date();
            // Extend by 1 year
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
        const { userId } = await auth();
        const activeId = userId || "demo_user";

        if (!userId || activeId === "demo_user") {
            return { success: false, error: "Image uploads are disabled in Demo Mode." };
        }

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
