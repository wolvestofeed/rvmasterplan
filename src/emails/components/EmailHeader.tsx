import { Img, Section } from "@react-email/components";
import { APP_URL } from "../config";

export function EmailHeader() {
    return (
        <Section style={headerStyle}>
            <Img
                src={`${APP_URL}/images/logos/RV-MasterPlan_logo-transparent-1.png`}
                alt="RV MasterPlan"
                width={220}
                height="auto"
                style={{ display: "block", margin: "0 auto" }}
            />
        </Section>
    );
}

const headerStyle = {
    backgroundColor: "#8ca163",
    padding: "28px 40px",
    textAlign: "center" as const,
    borderRadius: "8px 8px 0 0",
};
