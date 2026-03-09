"use client";

import { useEffect, useState } from "react";
import { HeaderHero } from "@/components/layout/header-hero";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Fuel, TrendingUp, Info, ArrowLeft } from "lucide-react";
import { getUserProfile } from "@/app/actions/profiles";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function FuelEconomyPage() {
    const [isClient, setIsClient] = useState(false);
    const [planType, setPlanType] = useState<string | null>(null);

    useEffect(() => {
        setIsClient(true);
        async function checkAccess() {
            const res = await getUserProfile();
            if (res.success && res.data) {
                setPlanType(res.data.planType || 'full');
            }
        }
        checkAccess();
    }, []);

    if (!isClient) return null;

    if (planType === 'starter') {
        return (
            <div className="container mx-auto py-20 px-4 text-center max-w-2xl">
                <Card className="p-12 border-2 border-dashed border-blue-200 bg-blue-50">
                    <CardHeader>
                        <Fuel className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                        <CardTitle className="text-3xl font-bold text-blue-900">Pro Feature Restricted</CardTitle>
                        <CardDescription className="text-lg text-blue-800">
                            <strong>Fuel Economy</strong> metrics and tracking are only available to Monthly and Annual Pro subscribers.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-blue-700">
                            Your Starter Pack gives you full access to all <strong>Setup & Build</strong> features (Purchase Calculator, Solar & Power, Water Systems) for 90 days.
                        </p>
                        <p className="text-blue-700 font-medium">
                            Upgrade to Pro to automatically track MPG, fuel costs, and efficiency trends from your receipt scans.
                        </p>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                        <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg font-bold">
                            <Link href="/renew">Upgrade to Pro</Link>
                        </Button>
                        <Button variant="ghost" asChild>
                            <Link href="/dashboard" className="flex items-center gap-2">
                                <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                            </Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }
    return (
        <div className="container mx-auto py-10 px-4 md:px-8 max-w-6xl">
            <HeaderHero
                title="Fuel Economy"
                description="Track your MPG, fuel costs, and efficiency over time. Data is automatically captured from your receipt scans."
                imageUrl="/images/page-headers/fuel-economy-header.jpg"
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <Card>
                    <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Average MPG</CardTitle>
                        <Fuel className="h-4 w-4 text-muted-foreground ml-auto" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">--.-</div>
                        <p className="text-xs text-muted-foreground">Based on your last 5 fill-ups</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Cost per Mile</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground ml-auto" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">$ --.--</div>
                        <p className="text-xs text-muted-foreground">Current monthly average</p>
                    </CardContent>
                </Card>

                <Card className="bg-blue-50 border-blue-200">
                    <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-blue-800">Efficiency Insight</CardTitle>
                        <Info className="h-4 w-4 text-blue-600 ml-auto" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-blue-700">
                            MPG metrics will appear here once you have at least two fuel receipts with odometer readings.
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="mt-12 text-center py-20 border-2 border-dashed rounded-lg bg-slate-50">
                <Fuel className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-600">No Fuel Data Yet</h3>
                <p className="text-slate-500 max-w-xs mx-auto mt-2">
                    Start by snapping a fuel receipt in the RV Living Budget tab. Be sure to include your odometer reading!
                </p>
            </div>
        </div>
    );
}
