import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Preview,
    Section,
    Text,
} from "@react-email/components";
import { EmailHeader } from "./components/EmailHeader";
import { EmailFooter } from "./components/EmailFooter";
import { PlanBadge } from "./components/PlanBadge";
import { FeatureList } from "./components/FeatureList";
import { APP_URL } from "./config";

interface WelcomeEmailProps {
    name: string;
    plan: "starter" | "full";
    billingInterval: "one_time" | "month" | "year";
    unsubscribeUrl: string;
}

const STARTER_FEATURES = [
    "RV Purchase Cost Calculator",
    "RV Setup Budget Tracker",
    "Power & Solar Calculator",
    "Water Usage Calculator",
    "Document Manager",
    "Equipment Tracker",
    "Department PDF Reports",
];

const PRO_FEATURES = [
    ...STARTER_FEATURES,
    "Monthly Living Budget",
    "Fuel Economy Tracker",
    "Full RV MasterPlan Combined Report",
];

const GETTING_STARTED = [
    "Complete your profile",
    "Add your RV vehicle info",
    "Add your electrical devices",
    "Add your equipment",
    "Set your usage patterns",
];

export default function WelcomeEmail({
    name,
    plan,
    billingInterval,
    unsubscribeUrl,
}: WelcomeEmailProps) {
    const firstName = name?.split(" ")[0] || "there";
    const features = plan === "starter" ? STARTER_FEATURES : PRO_FEATURES;

    return (
        <Html>
            <Head />
            <Preview>Welcome to RV MasterPlan — your subscription is confirmed.</Preview>
            <Body style={body}>
                <Container style={container}>
                    <EmailHeader />

                    <Section style={content}>
                        <Heading style={h1}>Welcome, {firstName}!</Heading>
                        <Text style={intro}>
                            Your subscription is confirmed. You now have full access to RV MasterPlan —
                            the all-in-one tool for managing your RV lifestyle.
                        </Text>

                        <PlanBadge plan={plan} billingInterval={billingInterval} />

                        {/* Features Included */}
                        <Heading style={h2}>What&apos;s included in your plan</Heading>
                        <FeatureList items={features} />

                        <Hr style={divider} />

                        {/* Getting Started */}
                        <Heading style={h2}>Getting started</Heading>
                        <Text style={bodyText}>
                            Here&apos;s the recommended setup order to get the most out of RV MasterPlan:
                        </Text>
                        <FeatureList items={GETTING_STARTED} />

                        <Hr style={divider} />

                        {/* Privacy */}
                        <Section style={privacyBox}>
                            <Text style={privacyText}>
                                🔒 <strong>Your privacy matters.</strong> All of your data is private and
                                securely stored. We never sell or share your personal information with
                                third parties — ever.
                            </Text>
                        </Section>

                        {/* CTA */}
                        <Section style={{ textAlign: "center" as const, margin: "32px 0 8px" }}>
                            <Button href={`${APP_URL}/dashboard`} style={ctaButton}>
                                Go to Dashboard
                            </Button>
                        </Section>
                    </Section>

                    <EmailFooter unsubscribeUrl={unsubscribeUrl} />
                </Container>
            </Body>
        </Html>
    );
}

// Styles
const body = {
    backgroundColor: "#f8fbf5",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    margin: "0",
    padding: "40px 0",
};

const container = {
    maxWidth: "560px",
    margin: "0 auto",
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
    overflow: "hidden",
};

const content = {
    padding: "32px 40px 8px",
};

const h1 = {
    fontSize: "24px",
    fontWeight: "700",
    color: "#2a4f3f",
    margin: "0 0 12px",
};

const h2 = {
    fontSize: "16px",
    fontWeight: "700",
    color: "#2a4f3f",
    margin: "0 0 12px",
};

const intro = {
    fontSize: "15px",
    color: "#374151",
    lineHeight: "1.6",
    margin: "0 0 24px",
};

const bodyText = {
    fontSize: "14px",
    color: "#374151",
    lineHeight: "1.6",
    margin: "0 0 12px",
};

const divider = {
    borderColor: "#e0e8d5",
    margin: "24px 0",
};

const privacyBox = {
    backgroundColor: "#f1f6ea",
    borderRadius: "8px",
    padding: "16px 20px",
};

const privacyText = {
    fontSize: "13px",
    color: "#374151",
    lineHeight: "1.6",
    margin: "0",
};

const ctaButton = {
    backgroundColor: "#2a4f3f",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: "600",
    borderRadius: "8px",
    padding: "14px 32px",
    textDecoration: "none",
    display: "inline-block",
};
