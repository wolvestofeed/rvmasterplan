import { Sidebar } from "@/components/layout/sidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-[#f8fbf5]">
            <Sidebar />
            <main className="flex-1 ml-64 bg-[#f8fbf5] relative">
                <div className="max-w-6xl mx-auto pb-12">
                    {children}
                </div>
            </main>
        </div>
    );
}
