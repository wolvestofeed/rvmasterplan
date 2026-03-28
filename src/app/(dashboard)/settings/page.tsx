"use client";

import { useState, useEffect } from "react";
import { HeaderHero } from "@/components/layout/header-hero";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser, SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { User, Mail, CreditCard, Shield } from "lucide-react";
import { toast } from "sonner";
import { getUserProfile, extendSubscription } from "@/app/actions/profiles";
import { createCustomerPortalSession } from "@/app/actions/stripe";

export default function SettingsPage() {
    const { user, isLoaded } = useUser();
    const [subDate, setSubDate] = useState<string>("Loading...");
    const [billingLabel, setBillingLabel] = useState<string>("");
    const [isAdmin, setIsAdmin] = useState(false);
    const [planType, setPlanType] = useState<string>("full");
    const [isPortalLoading, setIsPortalLoading] = useState(false);

    useEffect(() => {
        const loadProfile = async () => {
            const res = await getUserProfile();
            if (res.success && res.data) {
                if (res.data.subscriptionStatus === 'admin') {
                    setIsAdmin(true);
                    setSubDate("N/A — Admin");
                } else {
                    setPlanType(res.data.planType || "full");
                    // Set renewal date
                    if (res.data.subscriptionRenewalDate) {
                        setSubDate(new Date(res.data.subscriptionRenewalDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }));
                    } else {
                        setSubDate("No renewal date set");
                    }
                    // Set billing label from stored price and interval
                    if (res.data.billingAmountCents && res.data.billingInterval) {
                        const dollars = (res.data.billingAmountCents / 100).toFixed(2);
                        if (res.data.billingInterval === 'one_time') {
                            setBillingLabel(`One-time payment of $${dollars}.`);
                        } else {
                            const intervalLabel = res.data.billingInterval === 'year' ? 'yr' : 'mo';
                            setBillingLabel(`Billed at $${dollars}/${intervalLabel}.`);
                        }
                    } else if (res.data.planType === 'starter') {
                        setBillingLabel("Starter Pack — one-time purchase.");
                    } else {
                        setBillingLabel("Pro subscription.");
                    }
                }
            }
        };
        loadProfile();
    }, []);

    const handleSaveProfile = (e: React.FormEvent) => {
        e.preventDefault();
        toast.success("Profile updated successfully (Demo Mode)");
    };

    const handleManageBilling = async () => {
        setIsPortalLoading(true);
        const res = await createCustomerPortalSession();
        if (res.success && res.url) {
            window.location.href = res.url;
        } else {
            toast.error(res.error || "Could not open billing portal.");
        }
        setIsPortalLoading(false);
    };

    const handleExtendSubscription = async () => {
        toast.info("Extending subscription (Demo Mode)...");
        const res = await extendSubscription();
        if (res.success && res.date) {
            setSubDate(res.date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }));
            toast.success("Subscription extended by 1 year! See Dashboard.");
        } else {
            toast.error("Failed to extend subscription.");
        }
    };

    if (!isLoaded) {
        return <div className="p-10 text-center">Loading settings...</div>;
    }

    return (
        <div className="container mx-auto py-10 px-4 md:px-8 max-w-6xl">
            <HeaderHero
                title="Account Settings"
                description="Manage your profile, preferences, and subscription details."
                imageUrl="/images/logos/RV-MasterPlan_logo-header.jpg"
                imageClass="object-contain bg-white"
            />

            <SignedIn>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">

                    {/* User Profile Form */}
                    <Card className="lg:col-span-2 border border-slate-200">
                        <CardHeader className="border-b border-slate-100 pb-4">
                            <CardTitle className="flex items-center text-lg">
                                <User className="mr-2 h-5 w-5 text-slate-500" />
                                Personal Information
                            </CardTitle>
                            <CardDescription>Update your display name and email address.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <form onSubmit={handleSaveProfile} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="firstName">First Name</Label>
                                        <Input id="firstName" defaultValue={user?.firstName || ""} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lastName">Last Name</Label>
                                        <Input id="lastName" defaultValue={user?.lastName || ""} />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                        <Input
                                            id="email"
                                            type="email"
                                            className="pl-9 bg-slate-50 text-slate-500"
                                            defaultValue={user?.primaryEmailAddress?.emailAddress || ""}
                                            disabled
                                        />
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">Email changes must be verified through the security panel.</p>
                                </div>

                                <Button type="submit" className="bg-brand-primary hover:bg-brand-primary-dark text-white">
                                    Save Changes
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Right Column: Subscription & Security */}
                    <div className="space-y-8">

                        <Card className="border border-slate-200 border-t-4 border-t-[#2a4f3f]">
                            <CardHeader className="pb-4">
                                <CardTitle className="flex items-center text-lg">
                                    <CreditCard className="mr-2 h-5 w-5 text-brand-primary" />
                                    Subscription Plan
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="mb-4">
                                    <p className="text-sm text-brand-primary font-medium">Current Plan</p>
                                    <p className="text-xl font-bold text-slate-800">{isAdmin ? "Administrator" : planType === "starter" ? "Starter Pack" : "Pro Member"}</p>
                                    {isAdmin ? (
                                        <p className="text-xs text-slate-500 mt-1 pb-1">Full access — no subscription required.</p>
                                    ) : (
                                        <p className="text-xs text-slate-500 mt-1 pb-1">{billingLabel} Renews on <strong>{subDate}</strong>.</p>
                                    )}
                                </div>
                                {!isAdmin && (
                                    <div className="flex flex-col gap-2">
                                        <Button onClick={handleExtendSubscription} variant="outline" className="w-full bg-brand-primary/5 hover:bg-brand-primary/10 text-brand-primary border-brand-primary/20">
                                            Extend Sub by 1 Year (Demo)
                                        </Button>
                                        <Button
                                            onClick={handleManageBilling}
                                            disabled={isPortalLoading}
                                            variant="outline"
                                            className="w-full"
                                        >
                                            {isPortalLoading ? "Opening..." : planType === "starter" ? "View Payment History" : "Manage Billing"}
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {planType === "starter" && !isAdmin && (
                            <Card className="border border-[#8ca163]/40 border-t-4 border-t-[#8ca163]">
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center text-lg">
                                        <Shield className="mr-2 h-5 w-5 text-[#8ca163]" />
                                        Upgrade to Pro
                                    </CardTitle>
                                    <CardDescription>
                                        Unlock RV Living Budget, Fuel Economy, and all future Pro features.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Button
                                        className="w-full bg-[#8ca163] hover:bg-[#7a8e52] text-white"
                                        onClick={() => window.location.href = "/#pricing"}
                                    >
                                        View Pro Plans
                                    </Button>
                                </CardContent>
                            </Card>
                        )}

                    </div>
                </div>
            </SignedIn>

            <SignedOut>
                <Card className="mt-8 border border-blue-200 bg-blue-50/50">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <User className="h-12 w-12 text-blue-400 mb-4" />
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">You are in Guest Mode</h2>
                        <p className="text-slate-600 max-w-md mb-6">
                            Settings and profile management are only available for registered users. Create an account to save your master plan, manage documents, and set up your profile.
                        </p>
                        <SignInButton mode="modal">
                            <Button className="bg-brand-primary hover:bg-brand-primary-dark text-white">
                                Log In or Register
                            </Button>
                        </SignInButton>
                    </CardContent>
                </Card>
            </SignedOut>
        </div>
    );
}
