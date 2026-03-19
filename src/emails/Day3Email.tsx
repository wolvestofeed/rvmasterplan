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
import { FeatureRow } from "./components/FeatureRow";
import { APP_URL } from "./config";

interface Day3EmailProps {
    name: string;
    plan: "starter" | "full";
    unsubscribeUrl: string;
}

const SHARED_FEATURES = [
    {
        title: "Your Profile & RV Info",
        description:
            "Your vehicle specs, location, and personal details power the calculations across every module. The more you add, the more accurate your results.",
    },
    {
        title: "Power & Solar Calculator",
        description:
            "Add your electrical devices and solar equipment to model your daily energy consumption, battery capacity, and solar system sizing.",
    },
    {
        title: "Water Usage Calculator",
        description:
            "Log your water activities and tank sizes to track daily usage, estimate how long your tanks will last, and plan fills and dumps.",
    },
    {
        title: "RV Setup Budget Tracker",
        description:
            "Catalog every purchase from your build-out — track total cost, weight, priority, and what's still on your wish list.",
    },
    {
        title: "Document Manager",
        description:
            "Store registrations, insurance, warranties, and service records in one place — with renewal reminders so nothing slips through the cracks.",
    },
    {
        title: "Equipment Tracker",
        description:
            "Keep an organized inventory of your gear with cost, weight, category, and acquisition status.",
    },
    {
        title: "PDF Reports",
        description:
            "Generate individual department reports or combine everything into a full RV MasterPlan PDF — ready to share, print, or archive.",
    },
];

const PRO_ONLY_FEATURES = [
    {
        title: "Monthly Living Budget",
        description:
            "Set your income sources and populate your fixed and variable expenses to model your full monthly cost of RV living.",
    },
    {
        title: "Fuel Economy Tracker",
        description:
            "Log every fill-up to track MPG, monitor fuel cost trends, and measure gas and propane efficiency over time.",
    },
];

export default function Day3Email({ name, plan, unsubscribeUrl }: Day3EmailProps) {
    const firstName = name?.split(" ")[0] || "there";
    const features = plan === "starter" ? SHARED_FEATURES : [...SHARED_FEATURES, ...PRO_ONLY_FEATURES];

    return (
        <Html>
            <Head />
            <Preview>3 days in — here&apos;s how to get the most from RV MasterPlan.</Preview>
            <Body style={body}>
                <Container style={container}>
                    <EmailHeader />

                    <Section style={content}>
                        <Heading style={h1}>You&apos;re off to a great start, {firstName}.</Heading>

                        <Text style={intro}>
                            Three days in — how&apos;s it going? Whether you&apos;ve been exploring every corner
                            of the app or just getting your bearings, that&apos;s perfectly fine.
                            RV MasterPlan works the way you do.
                        </Text>

                        <Text style={bodyText}>
                            That said, the more data you put in, the more you get out. Your vehicle specs,
                            usage patterns, and expenses aren&apos;t just stored — they drive the calculations,
                            reports, and insights that make the app genuinely useful for your RV life.
                            There&apos;s no right or wrong way to use it. Focus on what matters most to you
                            and build from there.
                        </Text>

                        <Hr style={divider} />

                        <Heading style={h2}>A quick look at what&apos;s available</Heading>
                        <Text style={subText}>Use every module or just the ones that fit your lifestyle.</Text>

                        {features.map((feature, index) => (
                            <FeatureRow
                                key={index}
                                title={feature.title}
                                description={feature.description}
                            />
                        ))}

                        <Hr style={divider} />

                        <Section style={encourageBox}>
                            <Text style={encourageText}>
                                💡 <strong>Pro tip:</strong> Start with your Profile and RV Info — it takes
                                5 minutes and unlocks accurate results across every calculator in the app.
                            </Text>
                        </Section>

                        <Section style={{ textAlign: "center" as const, margin: "32px 0 8px" }}>
                            <Button href={`${APP_URL}/dashboard`} style={ctaButton}>
                                Open My Dashboard
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
    fontSize: "22px",
    fontWeight: "700",
    color: "#2a4f3f",
    margin: "0 0 16px",
};

const h2 = {
    fontSize: "16px",
    fontWeight: "700",
    color: "#2a4f3f",
    margin: "0 0 4px",
};

const intro = {
    fontSize: "15px",
    color: "#374151",
    lineHeight: "1.7",
    margin: "0 0 16px",
};

const bodyText = {
    fontSize: "14px",
    color: "#374151",
    lineHeight: "1.7",
    margin: "0 0 0",
};

const subText = {
    fontSize: "13px",
    color: "#9ca3af",
    margin: "0 0 20px",
};

const divider = {
    borderColor: "#e0e8d5",
    margin: "24px 0",
};

const encourageBox = {
    backgroundColor: "#f1f6ea",
    borderRadius: "8px",
    padding: "16px 20px",
};

const encourageText = {
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
