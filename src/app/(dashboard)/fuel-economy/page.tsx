"use client";

import { useEffect, useState } from "react";
import { HeaderHero } from "@/components/layout/header-hero";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Fuel, TrendingUp, ArrowLeft } from "lucide-react";
import { getUserProfile } from "@/app/actions/profiles";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { KpiValue } from "@/components/ui/kpi-value";
import { KpiBlock } from "@/components/ui/kpi-block";

export default function FuelEconomyPage() {
    const [isClient, setIsClient] = useState(false);
    const [planType, setPlanType] = useState<string | null>(null);

    const [fuelLogs, setFuelLogs] = useState<any[]>([]);

    useEffect(() => {
        setIsClient(true);
        async function checkAccess() {
            const res = await getUserProfile();
            if (res.success && res.data) {
                setPlanType(res.data.planType || 'full');
            }
        }

        async function loadFuelData() {
            try {
                const year = new Date().getFullYear();
                const expenses = await import("@/lib/actions/budget").then(m => m.getExpenses(year));

                // Filter and sort chronologically/by odometer
                const fuels = expenses
                    .filter((e: any) => e.category === 'Gasoline' && e.odometerReading)
                    .sort((a: any, b: any) => {
                        if (a.odometerReading !== b.odometerReading) {
                            return (a.odometerReading || 0) - (b.odometerReading || 0);
                        }
                        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                    });

                setFuelLogs(fuels);
            } catch (error) {
                console.error("Failed to load fuel data", error);
            }
        }

        checkAccess();
        loadFuelData();
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
    // Mathematics for Fuel Analytics
    let averageMPG = "--.-";
    let costPerMile = "--.--";
    let avgPricePerGallon = "--.--";
    let totalGallons = 0;

    if (fuelLogs.length >= 2) {
        let totalDistance = 0;
        let totalSpent = 0;

        for (let i = 1; i < fuelLogs.length; i++) {
            const prev = fuelLogs[i - 1];
            const curr = fuelLogs[i];

            const distance = (curr.odometerReading || 0) - (prev.odometerReading || 0);
            if (distance > 0 && curr.gallons > 0) {
                totalDistance += distance;
                totalGallons += Number(curr.gallons);
                totalSpent += Number(curr.amount);
            }
        }

        if (totalGallons > 0 && totalDistance > 0) {
            averageMPG = (totalDistance / totalGallons).toFixed(1);
            costPerMile = "$" + (totalSpent / totalDistance).toFixed(2);
            avgPricePerGallon = "$" + (totalSpent / totalGallons).toFixed(2);
        }
    }

    return (
        <div className="container mx-auto py-10 px-4 md:px-8 max-w-6xl">
            <HeaderHero
                title="Fuel Economy"
                description="Track your MPG, fuel costs, propane use, and efficiency over time. Data is automatically captured from your Living Budget fuel logs."
                imageUrl="/images/page-headers/rvmp-fuel-econ-header.jpg"
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                <KpiBlock label="Average MPG" variant="primary">
                    <KpiValue>{averageMPG}</KpiValue>
                    <div className="text-xs text-slate-500 mt-1 relative z-10">Based on your logged fill-ups</div>
                </KpiBlock>
                <KpiBlock label="Cost per Mile" variant="accent">
                    <KpiValue>{costPerMile}</KpiValue>
                    <div className="text-xs text-slate-500 mt-1 relative z-10">Current average</div>
                </KpiBlock>
                <KpiBlock label="Avg Price / Gallon" variant="primary">
                    <KpiValue>{avgPricePerGallon}</KpiValue>
                </KpiBlock>
                <KpiBlock label="Total Tracked" variant="accent">
                    <KpiValue>{totalGallons.toFixed(1)} gal</KpiValue>
                </KpiBlock>
            </div>

            {fuelLogs.length < 2 ? (
                <div className="mt-12 text-center py-20 border-2 border-dashed rounded-lg bg-slate-50">
                    <Fuel className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-600">Pending Fuel Data</h3>
                    <p className="text-slate-500 max-w-xs mx-auto mt-2">
                        We need at least two chronological fuel logs with odometer readings to calculate MPG. You currently have {fuelLogs.length}.
                    </p>
                </div>
            ) : (
                <div className="mt-12">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Recent Fill-ups</h3>
                    <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 border-b text-slate-600 uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4 text-right">Gallons</th>
                                    <th className="px-6 py-4 text-right">Odometer</th>
                                    <th className="px-6 py-4 text-right">Total Cost</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y text-slate-700">
                                {fuelLogs.slice().reverse().map((log: any, i: number) => (
                                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">{new Date(log.createdAt).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-right font-medium">{Number(log.gallons).toFixed(3)}</td>
                                        <td className="px-6 py-4 text-right">{log.odometerReading?.toLocaleString() || '--'}</td>
                                        <td className="px-6 py-4 text-right">${Number(log.amount).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
