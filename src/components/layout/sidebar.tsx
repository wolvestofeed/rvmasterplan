"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
    LayoutDashboard,
    Calculator,
    Wallet,
    Banknote,
    Zap,
    Sun,
    Droplets,
    FileText,
    PieChart,
    Settings,
    ShieldAlert
} from "lucide-react";
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from "@clerk/nextjs";

const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "RV Purchase Calculator", href: "/calculators/purchase", icon: Calculator, featureKey: "purchase_calculator" },
    { name: "RV Setup Budget", href: "/calculators/setup", icon: Wallet, featureKey: "setup_budget" },
    { name: "RV Living Budget", href: "/calculators/budget", icon: Banknote, featureKey: "living_budget" },
    { name: "Power and Solar Calculator", href: "/calculators/power/system", icon: Sun },
    { name: "Water Calculator", href: "/calculators/water", icon: Droplets, featureKey: "water_calculator" },
    { name: "Documents", href: "/documents", icon: FileText, featureKey: "document_manager" },
    { name: "Reports", href: "/reports/master", icon: PieChart },
    { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar({ featureFlags = {} }: { featureFlags?: Record<string, boolean> }) {
    const pathname = usePathname();
    const { user } = useUser();

    return (
        <div className="w-64 bg-[#f1f6ea] h-screen fixed left-0 top-0 border-r border-[#e0e8d5] flex flex-col justify-between overflow-y-auto">
            <div>
                <div className="p-6">
                    <Link href="/">
                        <Image
                            src="/images/logos/rv-masterplan-logo-landscape.png"
                            alt="RV MasterPlan Logo"
                            width={180}
                            height={60}
                            className="object-contain"
                        />
                    </Link>
                </div>

                <nav className="px-4 space-y-1">
                    {navItems
                        .filter(item => !item.featureKey || featureFlags[item.featureKey] !== false)
                        .map((item) => {
                            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive
                                        ? "bg-blue-100/50 text-blue-700 font-semibold"
                                        : "text-slate-600 hover:bg-[#e6ecd9] hover:text-slate-900"
                                        }`}
                                >
                                    <item.icon className="h-4 w-4" />
                                    {item.name}
                                </Link>
                            );
                        })}
                    {user?.publicMetadata?.role === 'admin' && (
                        <>
                            <div className="mt-8 mb-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                Administration
                            </div>
                            <Link
                                href="/admin"
                                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${pathname === '/admin'
                                    ? "bg-blue-100/50 text-blue-700 font-semibold"
                                    : "text-slate-600 hover:bg-[#e6ecd9] hover:text-slate-900"
                                    }`}
                            >
                                <ShieldAlert className="h-4 w-4" />
                                Admin Panel
                            </Link>
                        </>
                    )}
                </nav>
            </div>

            <div className="p-4 border-t border-[#e0e8d5] bg-[#e6ecd9]/30">
                <SignedIn>
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <UserButton afterSignOutUrl="/" />
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold text-slate-800">{user?.fullName || 'User'}</span>
                            {user?.publicMetadata?.role === 'admin' ? (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                                    <ShieldAlert className="h-3 w-3" />
                                    Admin
                                </span>
                            ) : (
                                <span className="text-xs text-slate-500">Subscriber</span>
                            )}
                        </div>
                    </div>
                </SignedIn>
                <SignedOut>
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center text-slate-500 font-bold">
                            G
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold text-slate-800">Guest User</span>
                            <span className="text-xs text-slate-500">Demo Mode</span>
                        </div>
                    </div>
                    <div className="w-full">
                        <SignInButton mode="modal">
                            <button className="w-full bg-white text-slate-800 border border-slate-300 py-2 rounded-md text-sm font-medium hover:bg-slate-50 transition">
                                Log In / Register
                            </button>
                        </SignInButton>
                    </div>
                </SignedOut>
            </div>
        </div>
    );
}
