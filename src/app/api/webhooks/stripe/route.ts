import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { userProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { sendOnboardingSequence } from "@/lib/email-service";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_fallback", {
    apiVersion: "2024-04-10" as Stripe.StripeConfig["apiVersion"],
});

export async function POST(req: Request) {
    const body = await req.text();
    const signature = (await headers()).get("stripe-signature") as string;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET as string
        );
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error(`Webhook signature verification failed.`, message);
        return new NextResponse(`Webhook Error: ${message}`, { status: 400 });
    }

    const session = event.data.object as Stripe.Checkout.Session;

    if (event.type === "checkout.session.completed") {
        const userId = session.client_reference_id;
        if (!userId) {
            return new NextResponse("Webhook Error: No user ID present in client_reference_id", { status: 400 });
        }

        const isOneTime = session.metadata?.isOneTime === 'true';
        const starterProductId = 'prod_U761gS5q8ey7b7';

        if (isOneTime) {
            // Logic for "Starter Pack" one-time payment
            const renewalDate = new Date();
            renewalDate.setDate(renewalDate.getDate() + 90); // 90 days access

            await db.update(userProfiles)
                .set({
                    subscriptionStatus: "active",
                    planType: "starter",
                    subscriptionRenewalDate: renewalDate,
                    billingInterval: "one_time",
                    billingAmountCents: session.amount_total || 2000,
                    stripeCustomerId: session.customer as string,
                })
                .where(eq(userProfiles.userId, userId));

            // Send onboarding email sequence
            await sendOnboardingSequence({
                userId,
                email: session.customer_details?.email || session.customer_email || "",
                name: session.customer_details?.name || "",
                plan: "starter",
                billingInterval: "one_time",
            });
        } else {
            // Logic for recurring subscriptions
            const subscription = await stripe.subscriptions.retrieve(
                session.subscription as string
            );

            // Extract interval from the subscription's plan
            const interval = subscription.items?.data?.[0]?.plan?.interval || "month";
            const amountCents = session.amount_total || (interval === "year" ? 6000 : 1000);

            await db.update(userProfiles)
                .set({
                    subscriptionStatus: "active",
                    planType: "full",
                    // @ts-expect-error - Stripe type expansion issue
                    subscriptionRenewalDate: new Date(subscription.current_period_end * 1000),
                    billingInterval: interval,
                    billingAmountCents: amountCents,
                    stripeCustomerId: session.customer as string,
                })
                .where(eq(userProfiles.userId, userId));

            // Send onboarding email sequence
            await sendOnboardingSequence({
                userId,
                email: session.customer_details?.email || session.customer_email || "",
                name: session.customer_details?.name || "",
                plan: "full",
                billingInterval: interval as "month" | "year",
            });
        }
    }

    if (event.type === "invoice.payment_succeeded") {
        const invoice = event.data.object as Stripe.Invoice;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((invoice as any).subscription) {
            const subscription = await stripe.subscriptions.retrieve(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (invoice as any).subscription as string
            );
            const userId = (subscription as Stripe.Subscription).metadata.userId;

            if (userId) {
                await db.update(userProfiles)
                    .set({
                        subscriptionStatus: "active",
                        // @ts-expect-error - Stripe type expansion issue
                        subscriptionRenewalDate: new Date(subscription.current_period_end * 1000),
                    })
                    .where(eq(userProfiles.userId, userId));
            }
        }
    }

    return new NextResponse(null, { status: 200 });
}
