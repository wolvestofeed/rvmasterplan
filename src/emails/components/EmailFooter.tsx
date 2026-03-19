import { Hr, Link, Section, Text } from "@react-email/components";

interface EmailFooterProps {
    unsubscribeUrl: string;
}

export function EmailFooter({ unsubscribeUrl }: EmailFooterProps) {
    return (
        <Section style={footerSection}>
            <Hr style={divider} />
            <Text style={privacyText}>
                Your data is private and securely stored. We never sell or share your personal information.
            </Text>
            <Text style={footerText}>
                © {new Date().getFullYear()} Wolves to Feed Publishing · RV MasterPlan
            </Text>
            <Text style={footerText}>
                <Link href={unsubscribeUrl} style={unsubscribeLink}>
                    Unsubscribe
                </Link>
                {" "}from these emails at any time.
            </Text>
        </Section>
    );
}

const footerSection = {
    padding: "0 40px 32px",
    backgroundColor: "#ffffff",
    borderRadius: "0 0 8px 8px",
};

const divider = {
    borderColor: "#e0e8d5",
    margin: "24px 0 20px",
};

const privacyText = {
    fontSize: "12px",
    color: "#6b7280",
    textAlign: "center" as const,
    margin: "0 0 8px",
};

const footerText = {
    fontSize: "12px",
    color: "#9ca3af",
    textAlign: "center" as const,
    margin: "0 0 4px",
};

const unsubscribeLink = {
    color: "#9ca3af",
    textDecoration: "underline",
};
