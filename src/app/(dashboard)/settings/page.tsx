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

export default function SettingsPage() {
    const { user, isLoaded } = useUser();
    const [subDate, setSubDate] = useState<string>("Loading...");

    useEffect(() => {
        const loadProfile = async () => {
            const res = await getUserProfile();
            if (res.success && res.data?.subscriptionRenewalDate) {
                setSubDate(new Date(res.data.subscriptionRenewalDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }));
            }
        };
        loadProfile();
    }, []);

    const handleSaveProfile = (e: React.FormEvent) => {
        e.preventDefault();
        toast.success("Profile updated successfully (Demo Mode)");
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

                                <Button type="submit" className="bg-[#2a4f3f] hover:bg-[#1a3a2d] text-white">
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
                                    <CreditCard className="mr-2 h-5 w-5 text-[#2a4f3f]" />
                                    Subscription Plan
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="mb-4">
                                    <p className="text-sm text-slate-500 font-medium">Current Plan</p>
                                    <p className="text-xl font-bold text-slate-800">Pro Member</p>
                                    <p className="text-xs text-slate-500 mt-1 pb-1">Billed at $4.99/mo. Renews on <strong>{subDate}</strong>.</p>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Button onClick={handleExtendSubscription} variant="outline" className="w-full bg-[#2a4f3f]/5 hover:bg-[#2a4f3f]/10 text-[#2a4f3f] border-[#2a4f3f]/20">
                                        Extend Sub by 1 Year (Demo)
                                    </Button>
                                    <Button onClick={() => toast.info("Stripe integration coming soon!")} variant="outline" className="w-full">
                                        Manage Billing
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

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
                            <Button className="bg-[#2a4f3f] hover:bg-[#1a3a2d] text-white">
                                Log In or Register
                            </Button>
                        </SignInButton>
                    </CardContent>
                </Card>
            </SignedOut>
        </div>
    );
}
