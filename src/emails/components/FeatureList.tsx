import { Text } from "@react-email/components";

interface FeatureListProps {
    items: string[];
}

export function FeatureList({ items }: FeatureListProps) {
    return (
        <div>
            {items.map((item, index) => (
                <div key={index} style={itemRow}>
                    <Text style={checkmark}>✓</Text>
                    <Text style={itemText}>{item}</Text>
                </div>
            ))}
        </div>
    );
}

const itemRow = {
    display: "flex" as const,
    alignItems: "flex-start" as const,
    marginBottom: "10px",
};

const checkmark = {
    color: "#8ca163",
    fontWeight: "700",
    fontSize: "15px",
    margin: "0 10px 0 0",
    minWidth: "16px",
};

const itemText = {
    fontSize: "14px",
    color: "#374151",
    margin: "0",
    lineHeight: "1.5",
};
