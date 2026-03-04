"use server";

import { db } from "@/lib/db";
import { userProfiles, users } from "@/lib/db/schema";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

const FALLBACK_USER_ID = "guest_user";

export async function getUserProfile() {
    try {
        await ensureGuestUser();

        // Fetch or create profile
        let profile = await db.query.userProfiles.findFirst({
            where: eq(userProfiles.userId, FALLBACK_USER_ID)
        });

        if (!profile) {
            // Give them a default active subscription 30 days from now
            const defaultDate = new Date();
            defaultDate.setDate(defaultDate.getDate() + 30);

            const newProfiles = await db.insert(userProfiles).values({
                id: Math.random().toString(36).substring(2, 10),
                userId: FALLBACK_USER_ID,
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
        await ensureGuestUser();

        const res = await getUserProfile();
        if (res.success && res.data) {
            const current = res.data.subscriptionRenewalDate ? new Date(res.data.subscriptionRenewalDate) : new Date();
            // Extend by 1 year
            current.setFullYear(current.getFullYear() + 1);

            await db.update(userProfiles)
                .set({ subscriptionRenewalDate: current, subscriptionStatus: 'active' })
                .where(eq(userProfiles.userId, FALLBACK_USER_ID));

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
