import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Link,
    Preview,
    Section,
    Text,
} from "@react-email/components";
import { EmailHeader } from "./components/EmailHeader";
import { EmailFooter } from "./components/EmailFooter";
import { APP_URL } from "./config";

interface Day7EmailProps {
    name: string;
    plan: "starter" | "full";
    unsubscribeUrl: string;
}

export default function Day7Email({ name, plan, unsubscribeUrl }: Day7EmailProps) {
    const firstName = name?.split(" ")[0] || "there";
    const isPro = plan === "full";

    return (
        <Html>
            <Head />
            <Preview>How&apos;s your setup coming along? Checking in from RV MasterPlan.</Preview>
            <Body style={body}>
                <Container style={container}>
                    <EmailHeader />

                    <Section style={content}>
                        <Heading style={h1}>How&apos;s your setup coming along, {firstName}?</Heading>

                        <Text style={bodyText}>
                            I hope you&apos;re finding RV MasterPlan more than a great value during this
                            exciting process in your adventure journey. I love the setup phase in every
                            project I work on, but I&apos;ve learned that having the right tools is an
                            essential strategy in the game.
                        </Text>

                        <Text style={bodyText}>
                            If there are any sections or formulas that don&apos;t make sense, just{" "}
                            <Link href="mailto:lonewolf@rvmasterplan.app" style={link}>
                                email me
                            </Link>{" "}
                            and I&apos;ll respond as quickly as possible.
                        </Text>

                        <Text style={bodyText}>
                            I&apos;m sure you&apos;ve realized by now that the more detailed info you enter,
                            the more accurate the app performs.
                        </Text>

                        {isPro ? (
                            <>
                                <Hr style={divider} />

                                <Heading style={h2}>A few helpful tips</Heading>

                                <Section style={tipBox}>
                                    <Text style={tipText}>
                                        <strong>Setup Budget vs. Living Budget</strong><br />
                                        Your setup budget is separate from your Living Budget, so make sure
                                        you enter your expenses in those tables appropriately.
                                    </Text>
                                </Section>

                                <Section style={tipBox}>
                                    <Text style={tipText}>
                                        <strong>Save time with auto-populate</strong><br />
                                        Build out one month of fixed expenses and auto-populate your annual
                                        budget — no need to enter the same data twelve times.
                                    </Text>
                                </Section>

                                <Section style={tipBox}>
                                    <Text style={tipText}>
                                        <strong>Snap Photo to Capture Expenses</strong><br />
                                        We hope you love this feature! Remember to select your fuel or general
                                        purchase option first, then review the auto-filled data before saving
                                        the transaction to your personal, private database.
                                    </Text>
                                </Section>

                                <Text style={closingText}>
                                    If you need any assistance, just let me know.
                                </Text>
                            </>
                        ) : (
                            <Text style={bodyText}>
                                If you think we&apos;re missing something important, just let me know — I&apos;d
                                love to hear your feedback.
                            </Text>
                        )}

                        <Hr style={divider} />

                        <Section style={{ textAlign: "center" as const, margin: "8px 0 8px" }}>
                            <Button href={`${APP_URL}/dashboard`} style={ctaButton}>
                                Open My Dashboard
                            </Button>
                        </Section>

                        <Text style={signoff}>
                            — Robert<br />
                            <Link href="mailto:lonewolf@rvmasterplan.app" style={link}>
                                lonewolf@rvmasterplan.app
                            </Link>
                        </Text>
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
    margin: "0 0 20px",
};

const h2 = {
    fontSize: "16px",
    fontWeight: "700",
    color: "#2a4f3f",
    margin: "0 0 16px",
};

const bodyText = {
    fontSize: "15px",
    color: "#374151",
    lineHeight: "1.7",
    margin: "0 0 16px",
};

const closingText = {
    fontSize: "15px",
    color: "#374151",
    lineHeight: "1.7",
    margin: "16px 0 0",
};

const divider = {
    borderColor: "#e0e8d5",
    margin: "24px 0",
};

const tipBox = {
    backgroundColor: "#f1f6ea",
    borderRadius: "8px",
    padding: "14px 18px",
    marginBottom: "12px",
};

const tipText = {
    fontSize: "13px",
    color: "#374151",
    lineHeight: "1.6",
    margin: "0",
};

const signoff = {
    fontSize: "14px",
    color: "#6b7280",
    lineHeight: "1.8",
    margin: "24px 0 16px",
};

const link = {
    color: "#2a4f3f",
    textDecoration: "underline",
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
