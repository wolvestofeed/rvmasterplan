"use client";

import { useState } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    FileText,
    Download,
    Battery,
    DollarSign,
    Droplets,
    FolderOpen
} from "lucide-react";
import { toast } from "sonner";
import { PDFGenerator } from "@/lib/pdfGenerator";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ReportsDashboard() {
    const [isGenerating, setIsGenerating] = useState<string | null>(null);

    const generateReport = async (type: string) => {
        setIsGenerating(type);

        try {
            // Simulate loading time for visual feedback
            await new Promise(resolve => setTimeout(resolve, 800));

            const pdf = new PDFGenerator();

            // In Demo mode, we use mock empty or default arrays since we don't have DB persistence yet
            // In the real app, we would fetch these from the server/context
            const mockExpenses = [
                { id: "1", name: "State Park Fee", group: "Essential" as const, category: "Campground" as const, costPerItem: 35, quantity: 4, tax: 0, month: 1, year: 2025 }
            ];
            const mockBudgets = [
                { month: 1, year: 2025, budgetedAmount: 2000 }
            ];

            const mockDevices = [
                { id: "1", name: "Starlink", group: "Essential" as const, category: "Work" as const, watts: 50, hoursPerDay: 8 }
            ];

            if (type === 'master') {
                pdf.generateMasterPlanReport(mockExpenses, mockBudgets, mockDevices, [], [], []);
                pdf.saveReport('RV_MasterPlan_Export.pdf');
            } else if (type === 'budget') {
                pdf.generateLivingBudgetReport(mockExpenses, mockBudgets);
                pdf.saveReport('RV_Living_Budget_Report.pdf');
            } else if (type === 'power') {
                pdf.generatePowerStrategyReport(mockDevices, [], [], []);
                pdf.saveReport('RV_Power_Strategy_Report.pdf');
            }

            toast.success(`${type.toUpperCase()} Report generated successfully!`);
        } catch (e) {
            toast.error("Failed to generate report.");
            console.error(e);
        } finally {
            setIsGenerating(null);
        }
    };

    return (
        <div className="container mx-auto py-10 px-4 md:px-8 max-w-6xl">
            <div className="mb-6">
                <Button variant="ghost" asChild className="-ml-4 text-muted-foreground hover:text-foreground">
                    <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Link>
                </Button>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-slate-900 flex items-center">
                        <FileText className="mr-3 h-8 w-8 text-slate-700" />
                        Reports & Exports
                    </h1>
                    <p className="text-slate-500 mt-2 max-w-2xl">
                        Download your master plan or specific departmental reports. PDF generation works entirely in your browser.
                    </p>
                </div>
            </div>

            {/* Featured Master Plan Export */}
            <Card className="mb-10 border-slate-200 border-t-4 border-t-slate-800 shadow-md bg-gradient-to-r from-slate-50 to-white">
                <div className="flex flex-col md:flex-row items-center">
                    <div className="flex-grow p-6 md:p-8">
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Master Plan Compilation</h2>
                        <p className="text-slate-600 mb-6 max-w-xl">
                            Generates a single, comprehensive PDF document containing all of your departmental data. This includes your Purchase Plan, Living Budget, Power Strategy, and Water Usage.
                        </p>
                        <div className="flex gap-4">
                            <Button
                                onClick={() => generateReport('master')}
                                disabled={isGenerating !== null}
                                className="bg-slate-800 hover:bg-slate-700 text-white font-medium"
                                size="lg"
                            >
                                {isGenerating === 'master' ? 'Compiling PDF...' : (
                                    <><Download className="mr-2 h-5 w-5" /> Download Full Master Plan</>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>

            <h2 className="text-xl font-bold text-slate-900 mb-6 font-heading">Departmental Reports</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                <Card className="hover:border-purple-300 transition-colors">
                    <CardHeader>
                        <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                            <DollarSign className="h-6 w-6 text-purple-600" />
                        </div>
                        <CardTitle>Living Budget</CardTitle>
                        <CardDescription>Export your monthly expenses, budget ceilings, and financial health scores.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            variant="outline"
                            className="w-full border-purple-200 hover:bg-purple-50 text-purple-700"
                            onClick={() => generateReport('budget')}
                            disabled={isGenerating !== null}
                        >
                            <Download className="mr-2 h-4 w-4" /> Download Tracker
                        </Button>
                    </CardContent>
                </Card>

                <Card className="hover:border-amber-300 transition-colors">
                    <CardHeader>
                        <div className="bg-amber-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                            <Battery className="h-6 w-6 text-amber-600" />
                        </div>
                        <CardTitle>Power Strategy</CardTitle>
                        <CardDescription>Export your daily watt-hour consumption and solar array setup.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            variant="outline"
                            className="w-full border-amber-200 hover:bg-amber-50 text-amber-700"
                            onClick={() => generateReport('power')}
                            disabled={isGenerating !== null}
                        >
                            <Download className="mr-2 h-4 w-4" /> Download Strategy
                        </Button>
                    </CardContent>
                </Card>

                <Card className="opacity-60 cursor-not-allowed">
                    <CardHeader>
                        <div className="bg-cyan-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                            <Droplets className="h-6 w-6 text-cyan-600" />
                        </div>
                        <CardTitle>Water Usage</CardTitle>
                        <CardDescription>Export your daily water consumption and tank capacities.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button variant="outline" className="w-full" disabled>
                            Coming Soon
                        </Button>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
