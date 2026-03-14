"use client";

import { HeaderHero } from "@/components/layout/header-hero";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SignOutButton } from "@clerk/nextjs";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { AlertCircle, ArrowRight, LogOut, CheckCircle2, Key } from "lucide-react";

export default function RenewPage() {
    const [accessCode, setAccessCode] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleApplyCode = async () => {
        if (!accessCode.trim()) {
            toast.error("Please enter an access code");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch("/api/apply-code", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: accessCode.trim() }),
            });

            const data = await res.json();
            if (data.success) {
                toast.success("Trial activated! Redirecting...");
                window.location.href = "/dashboard";
            } else {
                toast.error(data.error || "Invalid access code");
            }
        } catch (error) {
            toast.error("Failed to verify code");
        } finally {
            setIsSubmitting(false);
        }
    };
    return (
        <div className="min-h-screen bg-[#f8fbf5] flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-2xl">
                <HeaderHero
                    title="Subscription Inactive"
                    description="Your RV MasterPlan Free Trial or Subscription has expired."
                    imageUrl="/images/logos/RV-MasterPlan_logo-header.jpg"
                    imageClass="object-contain bg-white h-24"
                />

                <Card className="mt-8 border-2 shadow-xl border-brand-primary bg-white">
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                            <AlertCircle className="h-6 w-6 text-amber-600" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-brand-primary">Access Locked</CardTitle>
                        <CardDescription className="text-base mt-2 max-w-md mx-auto">
                            To continue using your personalized MasterPlan dashboard and keeping your data safe, please select a subscription plan.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-8">

                        <div className="grid md:grid-cols-2 gap-4">
                            {/* Option 1: Monthly */}
                            <div className="border border-slate-200 rounded-xl p-5 hover:border-brand-accent transition-colors relative flex flex-col">
                                <h3 className="font-semibold text-lg text-slate-800">Monthly Plan</h3>
                                <div className="mt-2 flex items-baseline text-3xl font-bold text-brand-primary">
                                    $9<span className="text-sm font-medium text-slate-500 ml-1">.99 /mo</span>
                                </div>
                                <ul className="mt-4 space-y-2 text-sm text-slate-600 flex-1">
                                    <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-brand-accent shrink-0" /> Full System Access</li>
                                    <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-brand-accent shrink-0" /> RV Setup Checklists</li>
                                    <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-brand-accent shrink-0" /> Maintenance Logs</li>
                                </ul>
                                <Button className="w-full mt-6 bg-brand-primary hover:bg-brand-primary-dark">
                                    Subscribe Monthly
                                </Button>
                            </div>

                            {/* Option 2: Annual */}
                            <div className="border-2 border-brand-accent bg-[#f8fbf5] rounded-xl p-5 relative flex flex-col shadow-sm">
                                <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-3">
                                    <span className="bg-amber-400 text-amber-950 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                                        Best Value
                                    </span>
                                </div>
                                <h3 className="font-semibold text-lg text-slate-800">Annual Plan</h3>
                                <div className="mt-2 flex items-baseline text-3xl font-bold text-brand-primary">
                                    $99<span className="text-sm font-medium text-slate-500 ml-1">.00 /yr</span>
                                </div>
                                <p className="text-xs text-brand-accent font-medium mt-1">Save 17% overall</p>
                                <ul className="mt-4 space-y-2 text-sm text-slate-600 flex-1">
                                    <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-brand-accent shrink-0" /> All Monthly Features</li>
                                    <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-brand-accent shrink-0" /> Advanced Power Strategies</li>
                                    <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-brand-accent shrink-0" /> Priority Support</li>
                                </ul>
                                <Button className="w-full mt-6 bg-[#8ca163] hover:bg-[#7a8e52] text-white">
                                    Subscribe Annually
                                </Button>
                            </div>
                        </div>

                        {/* Registration Code Section */}
                        <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 mt-6">
                            <h4 className="font-semibold text-slate-800 text-sm flex items-center gap-2 mb-3">
                                <Key className="w-4 h-4 text-slate-500" /> Have a Registration Code?
                            </h4>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Enter your VIP code..."
                                    value={accessCode}
                                    onChange={(e) => setAccessCode(e.target.value)}
                                    className="bg-white"
                                />
                                <Button
                                    onClick={handleApplyCode}
                                    disabled={isSubmitting}
                                    variant="outline"
                                    className="shrink-0 border-brand-primary text-brand-primary hover:bg-[#f8fbf5]"
                                >
                                    {isSubmitting ? "Verifying..." : "Apply Trial Code"}
                                </Button>
                            </div>
                            <p className="text-xs text-slate-500 mt-2">
                                Valid registration codes unlock a 30-day free trial with full feature access.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-100">
                            <SignOutButton>
                                <Button variant="ghost" className="text-slate-500 hover:text-slate-700">
                                    <LogOut className="w-4 h-4 mr-2" />
                                    Sign Out
                                </Button>
                            </SignOutButton>

                            <Link href="/">
                                <Button variant="outline" className="text-brand-primary border-brand-primary hover:bg-[#f8fbf5]">
                                    Return to Home <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
