import { Text } from "@react-email/components";

interface PlanBadgeProps {
    plan: "starter" | "full";
    billingInterval: "one_time" | "month" | "year";
}

export function PlanBadge({ plan, billingInterval }: PlanBadgeProps) {
    const label =
        plan === "starter"
            ? "Starter Pack"
            : billingInterval === "year"
              ? "Annual Pro"
              : "Monthly Pro";

    const terms =
        plan === "starter"
            ? "One-time $20 · 90-day access"
            : billingInterval === "year"
              ? "$60/year · Renews automatically"
              : "$10/month · Renews automatically";

    return (
        <div style={badgeWrapper}>
            <Text style={badgeLabel}>{label}</Text>
            <Text style={termsText}>{terms}</Text>
        </div>
    );
}

const badgeWrapper = {
    backgroundColor: "#f1f6ea",
    border: "2px solid #8ca163",
    borderRadius: "8px",
    padding: "12px 20px",
    textAlign: "center" as const,
    margin: "0 0 24px",
};

const badgeLabel = {
    fontSize: "16px",
    fontWeight: "700",
    color: "#2a4f3f",
    margin: "0 0 4px",
};

const termsText = {
    fontSize: "13px",
    color: "#6b7280",
    margin: "0",
};
