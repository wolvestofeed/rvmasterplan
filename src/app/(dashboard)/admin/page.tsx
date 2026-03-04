"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { HeaderHero } from "@/components/layout/header-hero";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
    Users, ShieldAlert, Settings, AlertTriangle, Server,
    Trash2, ToggleLeft, RefreshCcw, ExternalLink, Search, ChevronDown, ChevronUp
} from "lucide-react";
import { getAdminStats, getAllUsers, toggleUserSubscription, deleteUser, seedAdminUser, syncAdminDemoData } from "@/app/actions/admin";

// --- Mock Error Logs ---
const mockErrorLogs = [
    { id: 1, timestamp: "2026-03-04 13:21:04", source: "API /actions/dashboard", message: "Database connection timeout after 30s", severity: "error" as const },
    { id: 2, timestamp: "2026-03-04 12:05:18", source: "Clerk Webhook", message: "Webhook signature verification failed (retry succeeded)", severity: "warning" as const },
    { id: 3, timestamp: "2026-03-03 22:44:51", source: "Document Upload", message: "File size exceeded 5MB limit — rejected upload", severity: "warning" as const },
    { id: 4, timestamp: "2026-03-03 18:12:33", source: "Drizzle ORM", message: "Unique constraint violation on user_profiles.user_id", severity: "error" as const },
    { id: 5, timestamp: "2026-03-02 09:30:00", source: "Next.js Build", message: "Static generation warning: missing generateStaticParams for /reports/[id]", severity: "info" as const },
    { id: 6, timestamp: "2026-03-01 15:45:22", source: "Vercel Edge", message: "Cold start latency exceeded 3s on /api/documents/upload", severity: "warning" as const },
];

type AdminUser = {
    id: string;
    email: string;
    createdAt: Date;
    firstName: string | null;
    lastName: string | null;
    subscriptionStatus: string | null;
    subscriptionRenewalDate: Date | null;
};

export default function AdminPage() {
    const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
    const router = useRouter();
    const [stats, setStats] = useState<any>(null);
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [errorLogs, setErrorLogs] = useState(mockErrorLogs);
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Admin guard — redirect non-admin users
    useEffect(() => {
        if (clerkLoaded && clerkUser?.publicMetadata?.role !== 'admin') {
            router.replace('/dashboard');
        }
    }, [clerkLoaded, clerkUser, router]);

    // Settings state (in-memory for demo)
    const [demoMode, setDemoMode] = useState(true);
    const [defaultSubDays, setDefaultSubDays] = useState(30);
    const [featureSolarCapture, setFeatureSolarCapture] = useState(true);
    const [featureDocuments, setFeatureDocuments] = useState(true);
    const [featureWaterCalc, setFeatureWaterCalc] = useState(true);
    const [maintenanceMode, setMaintenanceMode] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        const [statsRes, usersRes] = await Promise.all([getAdminStats(), getAllUsers()]);
        if (statsRes.success && statsRes.data) setStats(statsRes.data);
        if (usersRes.success && usersRes.data) setUsers(usersRes.data as AdminUser[]);
        setIsLoading(false);
    };

    const handleToggleSub = async (userId: string) => {
        const res = await toggleUserSubscription(userId);
        if (res.success) {
            toast.success("Subscription toggled.");
            loadData();
        } else {
            toast.error("Failed to toggle subscription.");
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm(`Permanently delete user ${userId} and all their data?`)) return;
        const res = await deleteUser(userId);
        if (res.success) {
            toast.success("User deleted.");
            loadData();
        } else {
            toast.error("Failed to delete user.");
        }
    };

    const filteredUsers = users.filter(u =>
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.firstName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.lastName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const severityBadge = (severity: string) => {
        switch (severity) {
            case "error": return "bg-red-100 text-red-700 border-red-200";
            case "warning": return "bg-amber-100 text-amber-700 border-amber-200";
            case "info": return "bg-blue-100 text-blue-700 border-blue-200";
            default: return "bg-slate-100 text-slate-700 border-slate-200";
        }
    };

    if (isLoading) {
        return (
            <div className="container mx-auto py-10 px-4 md:px-8 max-w-6xl">
                <div className="flex items-center justify-center h-64">
                    <div className="text-slate-500 animate-pulse text-lg">Loading Admin Panel...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-10 px-4 md:px-8 max-w-6xl">
            <HeaderHero
                title="Administration Panel"
                description="Master Admin • User management, app settings, and system monitoring."
                imageUrl="/images/logos/RV-MasterPlan_logo-header.jpg"
                imageClass="object-contain bg-white"
            />

            {/* KPI Row */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6 mb-8">
                {[
                    { label: "Total Users", value: stats?.totalUsers || 0 },
                    { label: "Active Subs", value: stats?.activeSubscriptions || 0 },
                    { label: "Documents", value: stats?.totalDocuments || 0 },
                    { label: "Equipment", value: stats?.totalEquipment || 0 },
                    { label: "Events/Logs", value: stats?.totalEvents || 0 },
                ].map((kpi, i) => (
                    <Card key={i} className={`border-2 shadow-[4px_4px_12px_rgba(0,0,0,0.15)] ${i % 2 === 0
                        ? 'border-[#2a4f3f] bg-gradient-to-br from-white/90 via-white/40 to-[#2a4f3f]/30'
                        : 'border-[#8ca163] bg-gradient-to-br from-white/90 via-white/40 to-[#8ca163]/40'
                        }`}>
                        <CardContent className="p-4 text-center">
                            <p className="text-xs text-slate-500 font-medium">{kpi.label}</p>
                            <p className="text-2xl font-bold text-[#2a4f3f]">{kpi.value}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Tabs */}
            <Tabs defaultValue="users">
                <TabsList className="mb-6 grid w-full grid-cols-4 max-w-2xl">
                    <TabsTrigger value="users">Users & CRM</TabsTrigger>
                    <TabsTrigger value="settings">App Settings</TabsTrigger>
                    <TabsTrigger value="errors">Error Logs</TabsTrigger>
                    <TabsTrigger value="system">System Info</TabsTrigger>
                </TabsList>

                {/* =========== USERS TAB =========== */}
                <TabsContent value="users">
                    <Card>
                        <CardHeader className="pb-4 border-b border-slate-100">
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle className="text-lg font-bold text-slate-800">Registered Users</CardTitle>
                                    <CardDescription>{users.length} user{users.length !== 1 ? 's' : ''} in the system</CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                        <Input
                                            placeholder="Search users..."
                                            className="pl-9 w-56 h-9"
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                    <Button variant="outline" size="sm" onClick={loadData}>
                                        <RefreshCcw className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {filteredUsers.length === 0 ? (
                                <div className="p-8 text-center text-slate-500 italic">No users found.</div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {/* Table Header */}
                                    <div className="grid grid-cols-12 gap-2 px-6 py-3 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        <div className="col-span-3">User</div>
                                        <div className="col-span-3">Email</div>
                                        <div className="col-span-2">Status</div>
                                        <div className="col-span-2">Joined</div>
                                        <div className="col-span-2 text-right">Actions</div>
                                    </div>
                                    {/* User Rows */}
                                    {filteredUsers.map(user => (
                                        <div key={user.id}>
                                            <div
                                                className="grid grid-cols-12 gap-2 px-6 py-3 items-center hover:bg-slate-50/50 cursor-pointer transition-colors"
                                                onClick={() => setExpandedUserId(expandedUserId === user.id ? null : user.id)}
                                            >
                                                <div className="col-span-3 flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2a4f3f] to-[#8ca163] flex items-center justify-center text-white text-xs font-bold">
                                                        {(user.firstName?.[0] || user.email[0]).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-slate-800">
                                                            {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : 'No Name'}
                                                        </div>
                                                        <div className="text-xs text-slate-400 font-mono truncate max-w-[120px]">{user.id}</div>
                                                    </div>
                                                </div>
                                                <div className="col-span-3 text-sm text-slate-600 truncate">{user.email}</div>
                                                <div className="col-span-2">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${user.subscriptionStatus === 'active'
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : 'bg-slate-100 text-slate-500'
                                                        }`}>
                                                        {user.subscriptionStatus || 'No Profile'}
                                                    </span>
                                                </div>
                                                <div className="col-span-2 text-sm text-slate-500">
                                                    {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </div>
                                                <div className="col-span-2 flex justify-end gap-1">
                                                    <Button
                                                        variant="ghost" size="sm"
                                                        className="h-7 w-7 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                                        onClick={(e) => { e.stopPropagation(); handleToggleSub(user.id); }}
                                                        title="Toggle Subscription"
                                                    >
                                                        <ToggleLeft className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost" size="sm"
                                                        className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteUser(user.id); }}
                                                        title="Delete User"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                    {expandedUserId === user.id ? <ChevronUp className="h-4 w-4 text-slate-400 mt-1.5" /> : <ChevronDown className="h-4 w-4 text-slate-400 mt-1.5" />}
                                                </div>
                                            </div>
                                            {expandedUserId === user.id && (
                                                <div className="px-6 py-3 bg-slate-50 border-t border-slate-100">
                                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                                        <div>
                                                            <span className="text-slate-500">Subscription Renewal:</span>{' '}
                                                            <span className="font-medium text-slate-700">
                                                                {user.subscriptionRenewalDate
                                                                    ? new Date(user.subscriptionRenewalDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                                                                    : 'N/A'}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-500">User ID:</span>{' '}
                                                            <span className="font-mono text-xs text-slate-600">{user.id}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-500">Profile Status:</span>{' '}
                                                            <span className="font-medium text-slate-700">{user.subscriptionStatus || 'No profile created'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* =========== SETTINGS TAB =========== */}
                <TabsContent value="settings">
                    <div className="grid md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader className="pb-4 border-b border-slate-100">
                                <CardTitle className="text-lg font-bold text-slate-800">General Settings</CardTitle>
                                <CardDescription>Global app controls and defaults.</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-sm font-medium text-slate-800">Demo / Guest Mode</Label>
                                        <p className="text-xs text-slate-500 mt-0.5">Allow unauthenticated users to browse the app</p>
                                    </div>
                                    <Switch
                                        checked={demoMode}
                                        onCheckedChange={(v) => { setDemoMode(v); toast.success(`Demo mode ${v ? 'enabled' : 'disabled'}`); }}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-sm font-medium text-slate-800">Maintenance Mode</Label>
                                        <p className="text-xs text-slate-500 mt-0.5">Show a maintenance page to all non-admin users</p>
                                    </div>
                                    <Switch
                                        checked={maintenanceMode}
                                        onCheckedChange={(v) => { setMaintenanceMode(v); toast.success(`Maintenance mode ${v ? 'ON' : 'OFF'}`); }}
                                    />
                                </div>

                                <div>
                                    <Label className="text-sm font-medium text-slate-800">Default Subscription Length</Label>
                                    <p className="text-xs text-slate-500 mt-0.5 mb-2">Days granted to new subscribers</p>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            className="w-24"
                                            value={defaultSubDays}
                                            onChange={e => setDefaultSubDays(Number(e.target.value))}
                                        />
                                        <span className="text-sm text-slate-500">days</span>
                                        <Button size="sm" variant="outline" onClick={() => toast.success(`Default sub set to ${defaultSubDays} days`)}>
                                            Save
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-4 border-b border-slate-100">
                                <CardTitle className="text-lg font-bold text-slate-800">Feature Flags</CardTitle>
                                <CardDescription>Toggle app features on or off globally.</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-6">
                                {[
                                    { label: "Solar Capture Logging", desc: "Enable solar capture tab on Power page", state: featureSolarCapture, setter: setFeatureSolarCapture },
                                    { label: "Document Manager", desc: "Enable document upload and management", state: featureDocuments, setter: setFeatureDocuments },
                                    { label: "Water Calculator", desc: "Enable the water usage calculator", state: featureWaterCalc, setter: setFeatureWaterCalc },
                                ].map((flag, i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <div>
                                            <Label className="text-sm font-medium text-slate-800">{flag.label}</Label>
                                            <p className="text-xs text-slate-500 mt-0.5">{flag.desc}</p>
                                        </div>
                                        <Switch
                                            checked={flag.state}
                                            onCheckedChange={(v) => { flag.setter(v); toast.success(`${flag.label}: ${v ? 'ON' : 'OFF'}`); }}
                                        />
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* =========== ERROR LOGS TAB =========== */}
                <TabsContent value="errors">
                    <Card>
                        <CardHeader className="pb-4 border-b border-slate-100">
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle className="text-lg font-bold text-slate-800">Application Error Logs</CardTitle>
                                    <CardDescription>{errorLogs.length} entries • Mock data for demo</CardDescription>
                                </div>
                                <Button
                                    variant="outline" size="sm"
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => { setErrorLogs([]); toast.success("Error logs cleared."); }}
                                >
                                    Clear Logs
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {errorLogs.length === 0 ? (
                                <div className="p-8 text-center text-slate-500 italic">No error logs to display.</div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    <div className="grid grid-cols-12 gap-2 px-6 py-3 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        <div className="col-span-2">Timestamp</div>
                                        <div className="col-span-3">Source</div>
                                        <div className="col-span-5">Message</div>
                                        <div className="col-span-2 text-right">Severity</div>
                                    </div>
                                    {errorLogs.map(log => (
                                        <div key={log.id} className="grid grid-cols-12 gap-2 px-6 py-3 items-center hover:bg-slate-50/50">
                                            <div className="col-span-2 text-xs text-slate-500 font-mono">{log.timestamp}</div>
                                            <div className="col-span-3 text-sm text-slate-700 font-medium">{log.source}</div>
                                            <div className="col-span-5 text-sm text-slate-600">{log.message}</div>
                                            <div className="col-span-2 text-right">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${severityBadge(log.severity)}`}>
                                                    {log.severity}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* =========== SYSTEM INFO TAB =========== */}
                <TabsContent value="system">
                    <div className="grid md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader className="pb-4 border-b border-slate-100">
                                <CardTitle className="text-lg font-bold text-slate-800">Application Info</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="space-y-4">
                                    {[
                                        { label: "App Name", value: "RV MasterPlan" },
                                        { label: "Version", value: "2026.3.0" },
                                        { label: "Framework", value: "Next.js 16.1.6 (Turbopack)" },
                                        { label: "Database", value: "PostgreSQL via Neon + Drizzle ORM" },
                                        { label: "Auth Provider", value: "Clerk" },
                                        { label: "Hosting", value: "Vercel" },
                                        { label: "Environment", value: process.env.NODE_ENV || "development" },
                                    ].map((item, i) => (
                                        <div key={i} className="flex justify-between items-center py-1 border-b border-slate-50 last:border-0">
                                            <span className="text-sm text-slate-500">{item.label}</span>
                                            <span className="text-sm font-medium text-slate-800">{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-4 border-b border-slate-100">
                                <CardTitle className="text-lg font-bold text-slate-800">Quick Links</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="space-y-3">
                                    {[
                                        { label: "Clerk Dashboard", url: "https://dashboard.clerk.com", desc: "Manage users, sessions, and auth settings" },
                                        { label: "Vercel Dashboard", url: "https://vercel.com/dashboard", desc: "Deployments, domains, and environment variables" },
                                        { label: "GitHub Repository", url: "https://github.com/wolvestofeed/rvmasterplan", desc: "Source code, pull requests, and issues" },
                                        { label: "Neon Database", url: "https://console.neon.tech", desc: "PostgreSQL dashboard, queries, and branches" },
                                    ].map((link, i) => (
                                        <a
                                            key={i}
                                            href={link.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-[#2a4f3f]/30 hover:bg-slate-50 transition-colors group"
                                        >
                                            <div>
                                                <div className="text-sm font-medium text-slate-800 group-hover:text-[#2a4f3f]">{link.label}</div>
                                                <div className="text-xs text-slate-500">{link.desc}</div>
                                            </div>
                                            <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-[#2a4f3f]" />
                                        </a>
                                    ))}
                                </div>

                                <div className="mt-6 pt-4 border-t border-slate-100">
                                    <p className="text-sm font-medium text-slate-800 mb-2">Database Actions</p>
                                    <Button
                                        className="bg-[#2a4f3f] hover:bg-[#1a3a2d] text-white w-full"
                                        onClick={async () => {
                                            const res = await seedAdminUser();
                                            if (res.success) {
                                                toast.success(res.message || "Admin user seeded!");
                                                loadData();
                                            } else {
                                                toast.error(res.error || "Failed to seed admin user");
                                            }
                                        }}
                                    >
                                        Seed Admin Account (Robert Bogatin)
                                    </Button>
                                    <p className="text-xs text-slate-500 mt-1">Creates admin_robert with full demo data replica</p>
                                    <Button
                                        className="bg-blue-600 hover:bg-blue-700 text-white w-full mt-3"
                                        onClick={async () => {
                                            const res = await syncAdminDemoData();
                                            if (res.success) {
                                                toast.success(res.message || "Full demo data synced!");
                                                loadData();
                                            } else {
                                                toast.error(res.error || "Sync failed");
                                            }
                                        }}
                                    >
                                        Sync Full Demo Data (RV, Solar, Budget, Water)
                                    </Button>
                                    <p className="text-xs text-slate-500 mt-1">Populates all DB tables: vehicle, power, water, budget, equipment w/ specs</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
