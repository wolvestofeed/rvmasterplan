"use client";

import { useState } from "react";
import Image from "next/image";
import React from "react";
import {
    Download,
    Battery,
    DollarSign,
    Droplets,
    FolderOpen,
    LayoutDashboard,
    Calculator,
    Package,
    Fuel,
    BookOpen,
    Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { pdf } from "@react-pdf/renderer";
import { HeaderHero } from "@/components/layout/header-hero";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { getExpenses, getTargetBudgets } from "@/lib/actions/budget";
import { getElectricalDevices, getSolarEquipment } from "@/app/actions/power";
import { getRVVehicle, getFinancialData } from "@/app/actions/financials";
import { getUserProfile } from "@/app/actions/profiles";
import { getDashboardEvents } from "@/app/actions/dashboard";
import { getEquipmentItems } from "@/app/actions/equipment";
import { getWaterSystem, getWaterActivities, getTankLogs } from "@/app/actions/water";
import { getDocuments } from "@/app/actions/documents";

import { DashboardReport } from "@/lib/pdf/reports/DashboardReport";
import { LivingBudgetReport } from "@/lib/pdf/reports/LivingBudgetReport";
import { PowerSolarReport } from "@/lib/pdf/reports/PowerSolarReport";
import { PurchaseCalcReport } from "@/lib/pdf/reports/PurchaseCalcReport";
import { SetupBudgetReport } from "@/lib/pdf/reports/SetupBudgetReport";
import { FuelEconomyReport } from "@/lib/pdf/reports/FuelEconomyReport";
import { WaterReport } from "@/lib/pdf/reports/WaterReport";
import { DocumentsReport } from "@/lib/pdf/reports/DocumentsReport";
import { MasterPlanReport } from "@/lib/pdf/reports/MasterPlanReport";

type ReportType = 'master' | 'dashboard' | 'budget' | 'power' | 'purchase' | 'setup' | 'fuel' | 'water' | 'documents';

async function downloadBlob(element: React.ReactElement, filename: string) {
    const blob = await pdf(element as any).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

export default function ReportsDashboard() {
    const [isGenerating, setIsGenerating] = useState<ReportType | null>(null);

    const generateReport = async (type: ReportType) => {
        setIsGenerating(type);
        try {
            const currentYear = new Date().getFullYear();

            if (type === 'dashboard') {
                const [rvRes, profileRes, eventsRes] = await Promise.all([
                    getRVVehicle(),
                    getUserProfile(),
                    getDashboardEvents(),
                ]);
                const rvData = rvRes?.success ? rvRes.data : null;
                const profileData = profileRes?.success ? profileRes.data : null;
                const events = eventsRes?.success && eventsRes.data ? eventsRes.data : [];
                await downloadBlob(
                    React.createElement(DashboardReport, { rv: rvData, profile: profileData, events }),
                    "RVMP_Dashboard_Report.pdf"
                );
            }

            else if (type === 'budget') {
                const [expData, budData] = await Promise.all([
                    getExpenses(currentYear),
                    getTargetBudgets(currentYear),
                ]);
                const expenses = (Array.isArray(expData) ? expData : []).map((e: any) => ({
                    id: e.id,
                    name: e.name,
                    group: (e.group || "Essential") as "Essential" | "Non-essential",
                    category: e.category as string,
                    costPerItem: Number(e.amount) || 0,
                    quantity: 1,
                    tax: 0,
                    month: e.month || new Date(e.createdAt).getMonth() + 1,
                    year: e.year || currentYear,
                }));
                const budgets = (Array.isArray(budData) ? budData : []).map((b: any) => ({
                    month: Number(b.month),
                    year: Number(b.year) || currentYear,
                    budgetedAmount: Number(b.amount) || 0,
                }));
                await downloadBlob(
                    React.createElement(LivingBudgetReport, { expenses, budgets, year: currentYear }),
                    "RVMP_Living_Budget_Report.pdf"
                );
            }

            else if (type === 'power') {
                const [devRes, solarRes] = await Promise.all([
                    getElectricalDevices(),
                    getSolarEquipment(),
                ]);
                const devices = (devRes.success && devRes.data ? devRes.data : []).map((d: any) => ({
                    id: d.id,
                    name: d.name,
                    group: (d.groupType || "Essential") as string,
                    category: d.category || "Other",
                    watts: Number(d.watts) || 0,
                    hoursPerDay: Number(d.hoursPerDay) || 0,
                }));
                const solarEquipment = (solarRes.success && solarRes.data ? solarRes.data : []).map((e: any) => ({
                    id: e.id,
                    make: e.make || "",
                    model: e.model || "",
                    equipmentType: e.equipmentType || "",
                    wattage: Number(e.wattage) || 0,
                    quantity: Number(e.quantity) || 1,
                    weight: Number(e.weight) || 0,
                }));
                await downloadBlob(
                    React.createElement(PowerSolarReport, { devices, solarEquipment }),
                    "RVMP_Power_Solar_Report.pdf"
                );
            }

            else if (type === 'purchase') {
                const [rvRes, finRes] = await Promise.all([
                    getRVVehicle(),
                    getFinancialData(),
                ]);
                const rv = rvRes?.success ? rvRes.data : null;
                const financials = finRes?.success ? finRes.data : null;
                await downloadBlob(
                    React.createElement(PurchaseCalcReport, { rv, financials }),
                    "RVMP_Purchase_Calculator_Report.pdf"
                );
            }

            else if (type === 'setup') {
                const eqRes = await getEquipmentItems();
                const items = (eqRes?.success && eqRes.data ? eqRes.data : []).map((e: any) => ({
                    id: e.id,
                    name: e.name,
                    category: e.category || 'OTHER',
                    priority: e.priority || 'Must Have',
                    cost: Number(e.cost) || 0,
                    weight: Number(e.weight) || 0,
                    isAcquired: Boolean(e.isAcquired),
                    notes: e.notes || null,
                    purchaseDeadline: e.purchaseDeadline || null,
                }));
                await downloadBlob(
                    React.createElement(SetupBudgetReport, { items }),
                    "RVMP_Setup_Budget_Report.pdf"
                );
            }

            else if (type === 'fuel') {
                const expData = await getExpenses(currentYear);
                const allExp = Array.isArray(expData) ? expData : [];
                const fuelEntries = allExp
                    .filter((e: any) => e.category === 'Gasoline' || e.isFuelEvent)
                    .map((e: any) => ({
                        id: e.id,
                        name: e.name,
                        month: e.month || new Date(e.createdAt).getMonth() + 1,
                        year: e.year || currentYear,
                        amount: Number(e.amount) || 0,
                        gallons: e.gallons ? Number(e.gallons) : null,
                        odometerReading: e.odometerReading ? Number(e.odometerReading) : null,
                        isHitched: e.isHitched ?? null,
                        stateLocation: e.stateLocation || null,
                    }));
                await downloadBlob(
                    React.createElement(FuelEconomyReport, { fuelEntries, year: currentYear }),
                    "RVMP_Fuel_Economy_Report.pdf"
                );
            }

            else if (type === 'water') {
                const [sysRes, actRes, logRes] = await Promise.all([
                    getWaterSystem(),
                    getWaterActivities(),
                    getTankLogs(),
                ]);
                const waterSystem = sysRes?.success && sysRes.data ? sysRes.data : { freshWaterCapacity: 40, grayWaterCapacity: 30, blackWaterCapacity: 30 };
                const activities = (actRes?.success && actRes.data ? actRes.data : []).map((a: any) => ({
                    id: a.id,
                    name: a.name,
                    category: a.category || 'General',
                    gallonsPerUse: Number(a.gallonsPerUse) || 0,
                    timesPerDay: Number(a.timesPerDay) || 0,
                }));
                const tankLogs = (logRes?.success && logRes.data ? logRes.data : []).map((l: any) => ({
                    id: l.id,
                    date: l.date || l.createdAt || '',
                    type: l.type as 'Dump' | 'Fill',
                    tank: l.tank as 'Fresh' | 'Gray' | 'Black',
                    volume: Number(l.volume) || 0,
                }));
                await downloadBlob(
                    React.createElement(WaterReport, { waterSystem, activities, tankLogs }),
                    "RVMP_Water_Management_Report.pdf"
                );
            }

            else if (type === 'documents') {
                const docsRes = await getDocuments();
                const documents = (docsRes?.success && docsRes.data ? docsRes.data : []).map((d: any) => ({
                    id: d.id,
                    title: d.title,
                    fileType: d.fileType || 'Document',
                    renewalDate: d.renewalDate || null,
                    renewalCost: d.renewalCost ? Number(d.renewalCost) : null,
                    createdAt: d.createdAt,
                }));
                await downloadBlob(
                    React.createElement(DocumentsReport, { documents }),
                    "RVMP_Documents_Renewals_Report.pdf"
                );
            }

            else if (type === 'master') {
                const [
                    rvRes, profileRes, eventsRes,
                    finRes, eqRes,
                    expData, budData,
                    devRes, solarRes,
                    sysRes, actRes, logRes,
                    docsRes,
                ] = await Promise.all([
                    getRVVehicle(), getUserProfile(), getDashboardEvents(),
                    getFinancialData(), getEquipmentItems(),
                    getExpenses(currentYear), getTargetBudgets(currentYear),
                    getElectricalDevices(), getSolarEquipment(),
                    getWaterSystem(), getWaterActivities(), getTankLogs(),
                    getDocuments(),
                ]);

                const rv = rvRes?.success ? rvRes.data : null;
                const profile = profileRes?.success ? profileRes.data : null;
                const events = eventsRes?.success && eventsRes.data ? eventsRes.data : [];
                const financials = finRes?.success ? finRes.data : null;

                const setupItems = (eqRes?.success && eqRes.data ? eqRes.data : []).map((e: any) => ({
                    id: e.id, name: e.name, category: e.category || 'OTHER',
                    priority: e.priority || 'Must Have', cost: Number(e.cost) || 0,
                    weight: Number(e.weight) || 0, isAcquired: Boolean(e.isAcquired),
                    notes: e.notes || null, purchaseDeadline: e.purchaseDeadline || null,
                }));

                const allExp = Array.isArray(expData) ? expData : [];
                const expenses = allExp.map((e: any) => ({
                    id: e.id, name: e.name, group: (e.group || 'Essential') as string,
                    category: e.category as string, costPerItem: Number(e.amount) || 0,
                    quantity: 1, tax: 0,
                    month: e.month || new Date(e.createdAt).getMonth() + 1,
                    year: e.year || currentYear,
                }));
                const budgets = (Array.isArray(budData) ? budData : []).map((b: any) => ({
                    month: Number(b.month), year: Number(b.year) || currentYear,
                    budgetedAmount: Number(b.amount) || 0,
                }));
                const fuelEntries = allExp
                    .filter((e: any) => e.category === 'Gasoline' || e.isFuelEvent)
                    .map((e: any) => ({
                        id: e.id, name: e.name,
                        month: e.month || new Date(e.createdAt).getMonth() + 1,
                        year: e.year || currentYear, amount: Number(e.amount) || 0,
                        gallons: e.gallons ? Number(e.gallons) : null,
                        odometerReading: e.odometerReading ? Number(e.odometerReading) : null,
                        isHitched: e.isHitched ?? null, stateLocation: e.stateLocation || null,
                    }));

                const devices = (devRes?.success && devRes.data ? devRes.data : []).map((d: any) => ({
                    id: d.id, name: d.name, group: d.groupType || 'Essential',
                    category: d.category || 'Other', watts: Number(d.watts) || 0,
                    hoursPerDay: Number(d.hoursPerDay) || 0,
                }));
                const solarEquipment = (solarRes?.success && solarRes.data ? solarRes.data : []).map((e: any) => ({
                    id: e.id, make: e.make || '', model: e.model || '',
                    equipmentType: e.equipmentType || '', wattage: Number(e.wattage) || 0,
                    quantity: Number(e.quantity) || 1, weight: Number(e.weight) || 0,
                }));

                const waterSystem = sysRes?.success && sysRes.data ? sysRes.data : { freshWaterCapacity: 40, grayWaterCapacity: 30, blackWaterCapacity: 30 };
                const waterActivities = (actRes?.success && actRes.data ? actRes.data : []).map((a: any) => ({
                    id: a.id, name: a.name, category: a.category || 'General',
                    gallonsPerUse: Number(a.gallonsPerUse) || 0, timesPerDay: Number(a.timesPerDay) || 0,
                }));
                const tankLogs = (logRes?.success && logRes.data ? logRes.data : []).map((l: any) => ({
                    id: l.id, date: l.date || l.createdAt || '',
                    type: l.type as 'Dump' | 'Fill', tank: l.tank as 'Fresh' | 'Gray' | 'Black',
                    volume: Number(l.volume) || 0,
                }));

                const documents = (docsRes?.success && docsRes.data ? docsRes.data : []).map((d: any) => ({
                    id: d.id, title: d.title, fileType: d.fileType || 'Document',
                    renewalDate: d.renewalDate || null,
                    renewalCost: d.renewalCost ? Number(d.renewalCost) : null,
                    createdAt: d.createdAt,
                }));

                const rvLabel = rv ? [rv.year, rv.make, rv.model].filter(Boolean).join(' ') : undefined;
                const userName = profile?.firstName ? `${profile.firstName} ${profile.lastName || ''}`.trim() : undefined;

                await downloadBlob(
                    React.createElement(MasterPlanReport, {
                        userName, rvLabel, rv, profile, events,
                        financials, setupItems,
                        expenses, budgets, budgetYear: currentYear,
                        fuelEntries, fuelYear: currentYear,
                        devices, solarEquipment,
                        waterSystem, waterActivities, tankLogs,
                        documents,
                    }),
                    "RVMP_MasterPlan.pdf"
                );
            }

            toast.success("Report generated!");
        } catch (e) {
            console.error(e);
            toast.error("Failed to generate report.");
        } finally {
            setIsGenerating(null);
        }
    };

    const deptCards = [
        {
            type: 'dashboard' as ReportType,
            title: "Dashboard Overview",
            description: "Your RV profile, account summary, and upcoming scheduled events.",
            icon: LayoutDashboard,
            iconBg: "bg-blue-100",
            iconColor: "text-blue-600",
            btnBorder: "border-blue-200 hover:bg-blue-50 text-blue-700",
            enabled: true,
        },
        {
            type: 'purchase' as ReportType,
            title: "RV Purchase Calculator",
            description: "Purchase price, loan terms, monthly payment, and total cost of ownership.",
            icon: Calculator,
            iconBg: "bg-green-100",
            iconColor: "text-green-600",
            btnBorder: "border-green-200 hover:bg-green-50 text-green-700",
            enabled: true,
        },
        {
            type: 'setup' as ReportType,
            title: "RV Setup Budget",
            description: "Equipment list, acquisition status, total costs, and weight by category.",
            icon: Package,
            iconBg: "bg-orange-100",
            iconColor: "text-orange-600",
            btnBorder: "border-orange-200 hover:bg-orange-50 text-orange-700",
            enabled: true,
        },
        {
            type: 'budget' as ReportType,
            title: "RV Living Budget",
            description: "Monthly expenses, budget ceilings, variance tracking, and category breakdown.",
            icon: DollarSign,
            iconBg: "bg-purple-100",
            iconColor: "text-purple-600",
            btnBorder: "border-purple-200 hover:bg-purple-50 text-purple-700",
            enabled: true,
        },
        {
            type: 'fuel' as ReportType,
            title: "Fuel Economy",
            description: "MPG history, hitched vs unhitched averages, fuel cost per mile, and state breakdown.",
            icon: Fuel,
            iconBg: "bg-red-100",
            iconColor: "text-red-600",
            btnBorder: "border-red-200 hover:bg-red-50 text-red-700",
            enabled: true,
        },
        {
            type: 'power' as ReportType,
            title: "Power & Solar Strategy",
            description: "Daily watt-hour load analysis, solar array output, and battery bank specs.",
            icon: Battery,
            iconBg: "bg-amber-100",
            iconColor: "text-amber-600",
            btnBorder: "border-amber-200 hover:bg-amber-50 text-amber-700",
            enabled: true,
        },
        {
            type: 'water' as ReportType,
            title: "Water Management",
            description: "Tank capacities, daily usage by activity, fill/dump history, and duration estimates.",
            icon: Droplets,
            iconBg: "bg-cyan-100",
            iconColor: "text-cyan-600",
            btnBorder: "border-cyan-200 hover:bg-cyan-50 text-cyan-700",
            enabled: true,
        },
        {
            type: 'documents' as ReportType,
            title: "Documents & Renewals",
            description: "Document list, upcoming renewal dates, and annual renewal cost summary.",
            icon: FolderOpen,
            iconBg: "bg-slate-100",
            iconColor: "text-slate-600",
            btnBorder: "border-slate-200 hover:bg-slate-50 text-slate-700",
            enabled: true,
        },
    ];

    return (
        <div className="container mx-auto py-10 px-4 md:px-8 max-w-6xl">
            <HeaderHero
                title="RV Master Plan Reports"
                description="Download your master plan or individual departmental reports. All PDFs are generated in your browser."
                imageUrl="/images/page-headers/reports-header.jpg"
            />

            {/* Featured Master Plan Export */}
            <Card className="mb-10 border-slate-200 border-t-4 border-t-slate-800 shadow-md bg-gradient-to-r from-slate-50 to-white overflow-hidden">
                <div className="flex flex-col md:flex-row items-stretch">
                    <div className="relative w-full md:w-[40%] min-h-[250px] md:min-h-full">
                        <Image
                            src="/images/rv-photos/forest-sunset.jpg"
                            alt="RV at sunset"
                            fill
                            className="object-cover object-center"
                            sizes="(max-width: 768px) 100vw, 40vw"
                        />
                    </div>
                    <div className="flex-grow p-6 md:p-8 md:w-[60%] flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-3">
                            <BookOpen className="h-5 w-5 text-slate-500" />
                            <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">Full Compilation</span>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">RV MasterPlan</h2>
                        <p className="text-slate-600 mb-6 max-w-xl">
                            A single, professionally designed PDF containing all 8 departmental reports — branded cover sheet, dashboard profile, budgets, power strategy, water management, and more.
                        </p>
                        <div className="flex items-center gap-3">
                            <Button
                                onClick={() => generateReport('master')}
                                disabled={isGenerating !== null}
                                className="bg-slate-800 hover:bg-slate-700 text-white font-medium"
                                size="lg"
                            >
                                {isGenerating === 'master' ? (
                                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Compiling All Reports...</>
                                ) : (
                                    <><Download className="mr-2 h-5 w-5" /> Download Full Master Plan</>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>

            <h2 className="text-xl font-bold text-slate-900 mb-1 font-heading">Departmental Reports</h2>
            <p className="text-slate-500 text-sm mb-6">Each report captures all data from its corresponding section of the app.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {deptCards.map((card) => {
                    const Icon = card.icon;
                    const generating = isGenerating === card.type;
                    return (
                        <Card
                            key={card.type}
                            className={"transition-all duration-150 " + (card.enabled ? "hover:shadow-md hover:border-slate-300" : "opacity-60")}
                        >
                            <CardHeader className="pb-3">
                                {!card.enabled && (
                                    <div className="flex justify-end mb-1">
                                        <Badge variant="outline" className="text-xs text-slate-400 border-slate-200">
                                            Coming Soon
                                        </Badge>
                                    </div>
                                )}
                                <CardTitle className="text-base">{card.title}</CardTitle>
                                <CardDescription className="text-sm leading-relaxed">{card.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button
                                    variant="outline"
                                    className={"w-full " + card.btnBorder}
                                    onClick={() => { if (card.enabled) generateReport(card.type); }}
                                    disabled={!card.enabled || isGenerating !== null}
                                >
                                    {generating ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
                                    ) : card.enabled ? (
                                        <><Download className="mr-2 h-4 w-4" /> Download Report</>
                                    ) : (
                                        "Coming Soon"
                                    )}
                                </Button>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
