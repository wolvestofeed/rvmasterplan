import { Sidebar } from "@/components/layout/sidebar";
import { SubscriptionBanner } from "@/components/layout/subscription-banner";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { userProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSystemSettings } from "@/app/actions/admin";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { userId } = await auth();

    // If there is an actual signed-in user, check if they are an admin or have an active subscription
    if (userId) {
        const client = await clerkClient();
        const user = await client.users.getUser(userId);
        const role = user.publicMetadata?.role as string | undefined;
        if (role !== "admin") {
            const profile = await db.query.userProfiles.findFirst({
                where: eq(userProfiles.userId, userId)
            });

            const planType = profile?.planType || 'full';
            const isExpired = !profile?.subscriptionRenewalDate || new Date(profile.subscriptionRenewalDate) < new Date();
            const isInactive = profile?.subscriptionStatus !== "active";

            if (isExpired || isInactive) {
                redirect("/renew");
            }

            const renewalDate = profile?.subscriptionRenewalDate ? new Date(profile.subscriptionRenewalDate) : null;
            const daysRemaining = renewalDate
                ? Math.ceil((renewalDate.getTime() - Date.now()) / 86_400_000)
                : null;

            const { data: settings } = await getSystemSettings();
            const featureFlags = settings?.featureFlags as Record<string, boolean> | undefined;

            return (
                <div className="flex min-h-screen bg-[#f8fbf5]">
                    <Sidebar featureFlags={featureFlags || {}} planType={planType} daysRemaining={daysRemaining} />
                    <main className="flex-1 ml-64 bg-[#f8fbf5] relative">
                        <SubscriptionBanner daysRemaining={daysRemaining} planType={planType} />
                        <div className="max-w-6xl mx-auto pb-12">
                            {children}
                        </div>
                    </main>
                </div>
            );
        }
    }

    const { data: settings } = await getSystemSettings();
    const featureFlags = settings?.featureFlags as Record<string, boolean> | undefined;

    return (
        <div className="flex min-h-screen bg-[#f8fbf5]">
            <Sidebar featureFlags={featureFlags || {}} planType="full" daysRemaining={null} />
            <main className="flex-1 ml-64 bg-[#f8fbf5] relative">
                <div className="max-w-6xl mx-auto pb-12">
                    {children}
                </div>
            </main>
        </div>
    );
}
