"use server";

import { db } from "@/lib/db";
import { userProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getActiveUserId, requireAuth } from "@/lib/actions/auth-helpers";

export async function getUserLocation() {
    try {
        const activeId = await getActiveUserId();

        const profile = await db.query.userProfiles.findFirst({
            where: eq(userProfiles.userId, activeId)
        });

        if (!profile) return { success: false, error: "No profile found" };

        return {
            success: true,
            data: {
                name: profile.locationName || null,
                lat: profile.locationLat || null,
                lon: profile.locationLon || null,
            }
        };
    } catch (error) {
        console.error("Error fetching user location:", error);
        return { success: false, error: "Failed to fetch location" };
    }
}

export async function updateUserLocation(name: string, lat: string, lon: string) {
    try {
        const activeId = await requireAuth();

        await db.update(userProfiles)
            .set({
                locationName: name,
                locationLat: lat,
                locationLon: lon,
                updatedAt: new Date()
            })
            .where(eq(userProfiles.userId, activeId));

        revalidatePath("/weather");
        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Error updating location:", error);
        return { success: false, error: "Failed to save location" };
    }
}
