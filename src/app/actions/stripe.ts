"use server";

import Stripe from "stripe";
import { auth } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: "2024-04-10" as any,
});

export async function createCheckoutSession(productId: string, interval: "month" | "year", amountCents: number) {
    const { userId } = await auth();
    if (!userId || userId === "demo_user") {
        throw new Error("You must be logged in to subscribe.");
    }

    const headerList = await headers();
    const origin = headerList.get("origin") || "http://localhost:3000";

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "usd",
                        product: productId,
                        recurring: { interval },
                        unit_amount: amountCents,
                    },
                    quantity: 1,
                },
            ],
            mode: "subscription",
            success_url: `${origin}/dashboard?success=true`,
            cancel_url: `${origin}/?canceled=true`,
            client_reference_id: userId,
            subscription_data: {
                metadata: {
                    userId,
                },
            },
        });

        if (!session.url) {
            throw new Error("Failed to create checkout session.");
        }

        return { url: session.url };
    } catch (error: any) {
        console.error("Stripe Checkout Error:", error);
        throw new Error(error.message);
    }
}
