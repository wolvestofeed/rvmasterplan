import { randomUUID } from "crypto";
import { render } from "@react-email/components";
import { resend, FROM_EMAIL, APP_URL } from "@/lib/resend";
import { db } from "@/lib/db";
import { userProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import WelcomeEmail from "@/emails/WelcomeEmail";
import Day3Email from "@/emails/Day3Email";
import Day7Email from "@/emails/Day7Email";

interface OnboardingSequenceParams {
    userId: string;
    email: string;
    name: string;
    plan: "starter" | "full";
    billingInterval: "one_time" | "month" | "year";
}

export async function sendOnboardingSequence({
    userId,
    email,
    name,
    plan,
    billingInterval,
}: OnboardingSequenceParams) {
    // Check if user is unsubscribed
    const profile = await db.query.userProfiles.findFirst({
        where: eq(userProfiles.userId, userId),
        columns: { emailUnsubscribed: true, emailUnsubscribeToken: true },
    });

    if (profile?.emailUnsubscribed) {
        console.log(`Skipping onboarding emails — user ${userId} is unsubscribed.`);
        return;
    }

    // Generate unsubscribe token if not already set
    const token = profile?.emailUnsubscribeToken ?? randomUUID();

    if (!profile?.emailUnsubscribeToken) {
        await db
            .update(userProfiles)
            .set({ emailUnsubscribeToken: token })
            .where(eq(userProfiles.userId, userId));
    }

    const unsubscribeUrl = `${APP_URL}/unsubscribe?token=${token}`;

    // Email 1: Welcome — send immediately
    const welcomeHtml = await render(
        WelcomeEmail({ name, plan, billingInterval, unsubscribeUrl })
    );

    await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: "Welcome to RV MasterPlan — You're all set!",
        html: welcomeHtml,
    });

    // Email 2: Day 3 — feature walkthrough, scheduled 3 days out
    const day3Html = await render(
        Day3Email({ name, plan, unsubscribeUrl })
    );

    const day3SendAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

    await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: "3 days in — here's how to get the most from RV MasterPlan",
        html: day3Html,
        scheduledAt: day3SendAt,
    });

    // Email 3: Day 7 — personal check-in, plan-specific tips, scheduled 7 days out
    const day7Html = await render(
        Day7Email({ name, plan, unsubscribeUrl })
    );

    const day7SendAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: "How's your setup coming along?",
        html: day7Html,
        scheduledAt: day7SendAt,
    });
}
