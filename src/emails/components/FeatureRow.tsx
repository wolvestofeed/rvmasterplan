import { Text } from "@react-email/components";

interface FeatureRowProps {
    title: string;
    description: string;
}

export function FeatureRow({ title, description }: FeatureRowProps) {
    return (
        <div style={row}>
            <div style={indicator} />
            <div style={textBlock}>
                <Text style={titleText}>{title}</Text>
                <Text style={descText}>{description}</Text>
            </div>
        </div>
    );
}

const row = {
    display: "flex" as const,
    alignItems: "flex-start" as const,
    marginBottom: "16px",
};

const indicator = {
    width: "3px",
    minWidth: "3px",
    backgroundColor: "#8ca163",
    borderRadius: "2px",
    marginTop: "3px",
    marginRight: "14px",
    alignSelf: "stretch" as const,
};

const textBlock = {
    flex: "1" as const,
};

const titleText = {
    fontSize: "14px",
    fontWeight: "700" as const,
    color: "#2a4f3f",
    margin: "0 0 3px",
    lineHeight: "1.4",
};

const descText = {
    fontSize: "13px",
    color: "#6b7280",
    margin: "0",
    lineHeight: "1.5",
};
