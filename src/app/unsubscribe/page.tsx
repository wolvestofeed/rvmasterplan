import { db } from "@/lib/db";
import { userProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

interface UnsubscribePageProps {
    searchParams: Promise<{ token?: string }>;
}

export default async function UnsubscribePage({ searchParams }: UnsubscribePageProps) {
    const { token } = await searchParams;

    if (!token) {
        return <UnsubscribeResult status="invalid" />;
    }

    try {
        const profile = await db.query.userProfiles.findFirst({
            where: eq(userProfiles.emailUnsubscribeToken, token),
        });

        if (!profile) {
            return <UnsubscribeResult status="invalid" />;
        }

        if (profile.emailUnsubscribed) {
            return <UnsubscribeResult status="already" />;
        }

        await db
            .update(userProfiles)
            .set({ emailUnsubscribed: true })
            .where(eq(userProfiles.emailUnsubscribeToken, token));

        return <UnsubscribeResult status="success" />;
    } catch {
        return <UnsubscribeResult status="error" />;
    }
}

function UnsubscribeResult({ status }: { status: "success" | "already" | "invalid" | "error" }) {
    const content = {
        success: {
            icon: "✓",
            iconColor: "#8ca163",
            heading: "You've been unsubscribed",
            message: "You won't receive any more emails from RV MasterPlan. Your account and data remain active.",
        },
        already: {
            icon: "✓",
            iconColor: "#8ca163",
            heading: "Already unsubscribed",
            message: "You're already unsubscribed from RV MasterPlan emails.",
        },
        invalid: {
            icon: "✕",
            iconColor: "#ef4444",
            heading: "Invalid link",
            message: "This unsubscribe link is not valid or has expired.",
        },
        error: {
            icon: "!",
            iconColor: "#f59e0b",
            heading: "Something went wrong",
            message: "We couldn't process your request. Please try again or contact lonewolf@rvmasterplan.app.",
        },
    }[status];

    return (
        <div style={{
            minHeight: "100vh",
            backgroundColor: "#f8fbf5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}>
            <div style={{
                backgroundColor: "#ffffff",
                borderRadius: "16px",
                padding: "48px 40px",
                maxWidth: "440px",
                width: "100%",
                textAlign: "center",
                boxShadow: "0 4px_24px rgba(0,0,0,0.08)",
                border: "1px solid #e0e8d5",
            }}>
                <div style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "50%",
                    backgroundColor: content.iconColor + "1a",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 20px",
                    fontSize: "24px",
                    color: content.iconColor,
                    fontWeight: "700",
                }}>
                    {content.icon}
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src="/images/logos/RV-MasterPlan_logo-transparent-1.png"
                    alt="RV MasterPlan"
                    style={{ height: "36px", marginBottom: "24px" }}
                />
                <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#2a4f3f", margin: "0 0 12px" }}>
                    {content.heading}
                </h1>
                <p style={{ fontSize: "15px", color: "#6b7280", lineHeight: "1.6", margin: "0 0 32px" }}>
                    {content.message}
                </p>
                <a
                    href="https://rvmasterplan.app"
                    style={{
                        display: "inline-block",
                        backgroundColor: "#2a4f3f",
                        color: "#ffffff",
                        fontSize: "14px",
                        fontWeight: "600",
                        borderRadius: "8px",
                        padding: "12px 28px",
                        textDecoration: "none",
                    }}
                >
                    Return to RV MasterPlan
                </a>
            </div>
        </div>
    );
}
