import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { userProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: "2024-04-10" as any,
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
    } catch (error: any) {
        console.error(`Webhook signature verification failed.`, error.message);
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
    }

    const session = event.data.object as Stripe.Checkout.Session;

    if (event.type === "checkout.session.completed") {
        // Retrieve the subscription details from Stripe
        const subscription = (await stripe.subscriptions.retrieve(
            session.subscription as string
        )) as any;

        const userId = session.client_reference_id || subscription.metadata.userId;

        if (!userId) {
            return new NextResponse("Webhook Error: No user ID present in metadata", { status: 400 });
        }

        // Update the user's database profile to activate subscription
        await db.update(userProfiles)
            .set({
                subscriptionStatus: "active",
                subscriptionRenewalDate: new Date(subscription.current_period_end * 1000),
            })
            .where(eq(userProfiles.userId, userId));
    }

    if (event.type === "invoice.payment_succeeded") {
        const invoice = event.data.object as any;

        if (invoice.subscription) {
            const subscription = (await stripe.subscriptions.retrieve(
                invoice.subscription as string
            )) as any;

            const userId = subscription.metadata.userId;

            if (userId) {
                await db.update(userProfiles)
                    .set({
                        subscriptionStatus: "active",
                        subscriptionRenewalDate: new Date(subscription.current_period_end * 1000),
                    })
                    .where(eq(userProfiles.userId, userId));
            }
        }
    }

    return new NextResponse(null, { status: 200 });
}
