"use server";

import Stripe from "stripe";
import { auth } from "@clerk/nextjs/server";
import { headers } from "next/headers";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_fallback", {
    apiVersion: "2024-04-10" as Stripe.StripeConfig["apiVersion"],
});

export async function createCheckoutSession(productId: string, interval: "month" | "year" | null, amountCents: number) {
    const { userId } = await auth();
    if (!userId || userId === "demo_user") {
        throw new Error("You must be logged in to subscribe.");
    }

    const headerList = await headers();
    const origin = headerList.get("origin") || "http://localhost:3000";

    const isOneTime = interval === null || productId === 'prod_U761gS5q8ey7b7';
    const mode = isOneTime ? "payment" : "subscription";

    // Bypass Stripe in development mode
    if (process.env.NODE_ENV !== "production") {
        console.log(`[DEV MODE] Bypassing Stripe Checkout for ${productId} (${mode})`);
        // Simulate a successful checkout return
        return { url: `${origin}/welcome?success=true` };
    }

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "usd",
                        product: productId,
                        ...(isOneTime ? {} : { recurring: { interval: interval as "month" | "year" } }),
                        unit_amount: amountCents,
                    },
                    quantity: 1,
                },
            ],
            mode,
            success_url: `${origin}/welcome?success=true`,
            cancel_url: `${origin}/?canceled=true`,
            client_reference_id: userId,
            ...(isOneTime ? {} : {
                subscription_data: {
                    metadata: {
                        userId,
                    },
                },
            }),
            metadata: {
                userId,
                isOneTime: String(isOneTime)
            }
        });

        if (!session.url) {
            throw new Error("Failed to create checkout session.");
        }

        return { url: session.url };
    } catch (error: unknown) {
        const e = error as Error;
        console.error("Stripe Checkout Error:", e);
        throw new Error(e.message);
    }
}
