import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Weather, Sun & Moon | RV MasterPlan",
    description: "Daily solar, weather, and moon data for your location.",
};

export default function WeatherLayout({ children }: { children: React.ReactNode }) {
    return children;
}
