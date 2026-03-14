"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SaveIcon, PrinterIcon, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { KpiValue } from "@/components/ui/kpi-value";
import { KpiBlock } from "@/components/ui/kpi-block";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
    calculateLoanPayment,
    calculateTotalInterest,
    formatCurrency
} from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { FinancialData, FinancialSummary } from "@/types";
import { toast } from "sonner";
import { HeaderHero } from "@/components/layout/header-hero";
import { getFinancialData, updateFinancialData } from "@/app/actions/financials";

const financialSchema = z.object({
    rvType: z.string().min(1, { message: "RV type is required" }),
    year: z.string().min(1, { message: "Year is required" }),
    make: z.string().min(1, { message: "Make is required" }),
    model: z.string().min(1, { message: "Model is required" }),
    length: z.coerce.number().min(1, { message: "Length is required" }),
    weight: z.coerce.number().min(0, { message: "Weight must be 0 or greater" }),
    purchasePrice: z.coerce.number().min(1, { message: "Purchase price is required" }),
    salesTaxRate: z.coerce.number().min(0),
    downPayment: z.coerce.number().min(0),
    tradeInValue: z.coerce.number().min(0),
    loanTerm: z.string().min(1, { message: "Loan term is required" }),
    interestRate: z.coerce.number().min(0),
    creditScore: z.string().min(1, { message: "Credit score is required" }),
    registrationFees: z.coerce.number().min(0),
    insurance: z.coerce.number().min(0),
    extendedWarranty: z.coerce.number().min(0),
    accessories: z.coerce.number().min(0),
});

type FinancialFormValues = z.infer<typeof financialSchema>;

export default function PurchaseCalculatorPage() {
    const [isClient, setIsClient] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const defaultValues: FinancialFormValues = {
        rvType: "Travel Trailer",
        year: "2026",
        make: "Dutchmen",
        model: "Aspen Trail LE 21RD",
        length: 21,
        weight: 3600,
        purchasePrice: 0,
        salesTaxRate: 0,
        downPayment: 0,
        tradeInValue: 0,
        loanTerm: "5",
        interestRate: 0,
        creditScore: "Excellent (720+)",
        registrationFees: 0,
        insurance: 0,
        extendedWarranty: 0,
        accessories: 0,
    };

    const form = useForm<FinancialFormValues>({
        resolver: zodResolver(financialSchema) as any,
        defaultValues,
    });

    useEffect(() => {
        setIsClient(true);
        const fetchData = async () => {
            const { success, data } = await getFinancialData();
            if (success && data) {
                form.reset({
                    rvType: "Travel Trailer",
                    year: "2026",
                    make: "Dutchmen",
                    model: "Aspen Trail LE 21RD",
                    length: 21,
                    weight: 3600,
                    purchasePrice: Number(data.purchasePrice),
                    salesTaxRate: Number(data.salesTaxRate),
                    downPayment: Number(data.downPayment),
                    tradeInValue: Number(data.tradeInValue),
                    loanTerm: data.loanTermYears?.toString() || "5",
                    interestRate: Number(data.interestRate),
                    creditScore: data.creditScore || "Excellent (720+)",
                    registrationFees: Number(data.registrationFees),
                    insurance: Number(data.insurance),
                    extendedWarranty: Number(data.extendedWarranty),
                    accessories: Number(data.accessories),
                });
            }
            setIsLoading(false);
        };
        fetchData();
    }, [form]);

    const formValues = form.watch();

    let summary = {
        amountToFinance: 0,
        monthlyPayment: 0,
        totalInterest: 0,
        totalLoanCost: 0,
        totalInvestment: 0
    };

    try {
        const purchasePrice = Math.max(0, formValues.purchasePrice || 0);
        const salesTaxRate = Math.max(0, formValues.salesTaxRate || 0);
        const downPayment = Math.max(0, formValues.downPayment || 0);
        const tradeInValue = Math.max(0, formValues.tradeInValue || 0);
        const registrationFees = Math.max(0, formValues.registrationFees || 0);
        const extendedWarranty = Math.max(0, formValues.extendedWarranty || 0);
        const accessories = Math.max(0, formValues.accessories || 0);
        const interestRate = Math.max(0, formValues.interestRate || 0);
        const loanTerm = Math.max(1, parseInt(formValues.loanTerm) || 5);

        const salesTax = (purchasePrice * salesTaxRate) / 100;
        const totalAdditions = salesTax + registrationFees + extendedWarranty + accessories;
        const totalDeductions = downPayment + tradeInValue;

        const amountToFinance = Math.max(0, purchasePrice + totalAdditions - totalDeductions);
        const monthlyPayment = calculateLoanPayment(amountToFinance, interestRate, loanTerm);
        const totalInterest = calculateTotalInterest(amountToFinance, monthlyPayment, loanTerm);
        const totalLoanCost = amountToFinance + totalInterest;
        const totalInvestment = totalLoanCost + downPayment + tradeInValue;

        summary = { amountToFinance, monthlyPayment, totalInterest, totalLoanCost, totalInvestment };
    } catch (error) {
        console.error(error);
    }

    const onSubmit = async (data: FinancialFormValues) => {
        const loadingToast = toast.loading("Saving calculations...");
        const result = await updateFinancialData(data);
        if (result.success) {
            toast.success("Calculations saved!", { id: loadingToast });
        } else {
            toast.error(result.error || "Failed to save", { id: loadingToast });
        }
    };

    const costBreakdownData = [
        { name: 'Loan', value: summary.monthlyPayment },
        { name: 'Insurance', value: formValues.insurance / 12 },
        { name: 'Registration', value: formValues.registrationFees / 12 },
        { name: 'Maintenance', value: 100 }
    ];

    const totalMonthlyCost = costBreakdownData.reduce((total, item) => total + item.value, 0);

    if (!isClient) return null;

    return (
        <div className="container mx-auto py-10 px-4 md:px-8 max-w-6xl">
            <HeaderHero
                title="Purchase Planner"
                description="Calculate all costs associated with purchasing and owning an RV, including financing, insurance, and maintenance."
                imageUrl="/images/page-headers/purchase-header.png"
            />

            <div className="flex justify-between items-center mt-2 mb-8">
                {isLoading && <span className="text-sm text-slate-500">Loading your data...</span>}
                {!isLoading && <div />}
                <Button onClick={form.handleSubmit(onSubmit)} className="flex items-center" disabled={isLoading}>
                    <SaveIcon className="mr-2 h-4 w-4" /> Save Calculations
                </Button>
            </div>

            <Card className="p-6 bg-slate-50 mb-6">
                <h3 className="text-lg font-medium text-slate-800 mb-4">Financing Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <KpiBlock label="Amount to Finance" variant="primary">
                        <KpiValue>{formatCurrency(summary.amountToFinance)}</KpiValue>
                        <div className="text-xs text-slate-400 mt-1 relative z-10">Purchase + taxes - down payment - trade-in</div>
                    </KpiBlock>
                    <KpiBlock label="Monthly Payment" variant="accent">
                        <KpiValue>{formatCurrency(summary.monthlyPayment)}</KpiValue>
                        <div className="text-xs text-slate-400 mt-1 relative z-10">Principal + interest for {formValues.loanTerm} years</div>
                    </KpiBlock>
                    <KpiBlock label="Total Interest" variant="primary">
                        <KpiValue>{formatCurrency(summary.totalInterest)}</KpiValue>
                        <div className="text-xs text-slate-400 mt-1 relative z-10">{((summary.totalInterest / summary.amountToFinance || 0) * 100).toFixed(1)}% of principal</div>
                    </KpiBlock>
                    <KpiBlock label="Total Cost" variant="accent">
                        <KpiValue>{formatCurrency(summary.totalLoanCost)}</KpiValue>
                        <div className="text-xs text-slate-400 mt-1 relative z-10">Principal + interest over loan term</div>
                    </KpiBlock>
                </div>
            </Card>

            <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-6 md:col-span-2">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)}>

                            <Card className="p-6 mb-6">
                                <h3 className="text-lg font-medium text-slate-800 mb-4">RV Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField control={form.control} name="rvType" render={({ field }) => (
                                        <FormItem><FormLabel>RV Type</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Travel Trailer">Travel Trailer</SelectItem>
                                                    <SelectItem value="Fifth Wheel">Fifth Wheel</SelectItem>
                                                    <SelectItem value="Class A Motorhome">Class A Motorhome</SelectItem>
                                                    <SelectItem value="Class B Motorhome">Class B Motorhome</SelectItem>
                                                    <SelectItem value="Class C Motorhome">Class C Motorhome</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="year" render={({ field }) => (
                                        <FormItem><FormLabel>Year</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    <SelectItem value="2026">2026</SelectItem>
                                                    <SelectItem value="2025">2025</SelectItem>
                                                    <SelectItem value="2024">2024</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="make" render={({ field }) => (
                                        <FormItem><FormLabel>Make</FormLabel>
                                            <FormControl><Input placeholder="e.g., Winnebago" {...field} /></FormControl>
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="model" render={({ field }) => (
                                        <FormItem><FormLabel>Model</FormLabel>
                                            <FormControl><Input placeholder="e.g., Vista" {...field} /></FormControl>
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="length" render={({ field }) => (
                                        <FormItem><FormLabel>Length (feet)</FormLabel>
                                            <FormControl><Input type="number" {...field} /></FormControl>
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="weight" render={({ field }) => (
                                        <FormItem><FormLabel>Dry Weight (lbs)</FormLabel>
                                            <FormControl><Input type="number" {...field} /></FormControl>
                                        </FormItem>
                                    )} />
                                </div>
                            </Card>

                            <div className="space-y-8 mt-6 p-6 border rounded-lg bg-blue-50 mb-6">
                                <h3 className="text-xl font-medium text-slate-800">Interactive Loan Calculator</h3>
                                <p className="text-slate-500">Adjust the sliders to see how changes affect your loan and budget in real-time</p>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <Label>Purchase Price: {formatCurrency(formValues.purchasePrice)}</Label>
                                        <input type="range" min={10000} max={200000} step={1000} value={formValues.purchasePrice} onChange={(e) => form.setValue("purchasePrice", parseFloat(e.target.value))} className="w-full h-2 bg-slate-300 rounded-lg appearance-none cursor-pointer" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Down Payment: {formatCurrency(formValues.downPayment)}</Label>
                                        <input type="range" min={0} max={formValues.purchasePrice * 0.5} step={500} value={formValues.downPayment} onChange={(e) => form.setValue("downPayment", parseFloat(e.target.value))} className="w-full h-2 bg-slate-300 rounded-lg appearance-none cursor-pointer" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Interest Rate: {formValues.interestRate}%</Label>
                                        <input type="range" min={2} max={15} step={0.1} value={formValues.interestRate} onChange={(e) => form.setValue("interestRate", parseFloat(e.target.value))} className="w-full h-2 bg-slate-300 rounded-lg appearance-none cursor-pointer" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Loan Term: {formValues.loanTerm} years</Label>
                                        <input type="range" min={5} max={20} step={1} value={parseInt(formValues.loanTerm)} onChange={(e) => form.setValue("loanTerm", e.target.value)} className="w-full h-2 bg-slate-300 rounded-lg appearance-none cursor-pointer" />
                                    </div>
                                </div>
                            </div>

                            <Card className="p-6 mb-6">
                                <h3 className="text-lg font-medium text-slate-800 mb-4">Purchase Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField control={form.control} name="purchasePrice" render={({ field }) => (
                                        <FormItem><FormLabel>Purchase Price ($)</FormLabel>
                                            <FormControl><Input type="number" {...field} /></FormControl>
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="salesTaxRate" render={({ field }) => (
                                        <FormItem><FormLabel>Sales Tax Rate (%)</FormLabel>
                                            <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="downPayment" render={({ field }) => (
                                        <FormItem><FormLabel>Down Payment ($)</FormLabel>
                                            <FormControl><Input type="number" {...field} /></FormControl>
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="tradeInValue" render={({ field }) => (
                                        <FormItem><FormLabel>Trade-In Value ($)</FormLabel>
                                            <FormControl><Input type="number" {...field} /></FormControl>
                                        </FormItem>
                                    )} />
                                </div>
                            </Card>

                            <Card className="p-6 mb-6">
                                <h3 className="text-lg font-medium text-slate-800 mb-4">Additional Costs</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField control={form.control} name="registrationFees" render={({ field }) => (
                                        <FormItem><FormLabel>Registration Fees ($)</FormLabel>
                                            <FormControl><Input type="number" {...field} /></FormControl>
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="insurance" render={({ field }) => (
                                        <FormItem><FormLabel>Insurance ($/year)</FormLabel>
                                            <FormControl><Input type="number" {...field} /></FormControl>
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="extendedWarranty" render={({ field }) => (
                                        <FormItem><FormLabel>Extended Warranty ($)</FormLabel>
                                            <FormControl><Input type="number" {...field} /></FormControl>
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="accessories" render={({ field }) => (
                                        <FormItem><FormLabel>Accessories/Upgrades ($)</FormLabel>
                                            <FormControl><Input type="number" {...field} /></FormControl>
                                        </FormItem>
                                    )} />
                                </div>
                            </Card>
                        </form>
                    </Form>
                </div>

                <div className="space-y-6">
                    <Card className="p-6">
                        <h3 className="text-lg font-medium text-slate-800 mb-4">Monthly Cost Breakdown</h3>
                        <div className="space-y-3">
                            {costBreakdownData.map((item, index) => (
                                <div key={index} className="flex items-center">
                                    <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-4 bg-blue-600" style={{ width: `${Math.min(100, (item.value / totalMonthlyCost) * 100)}%` }} />
                                    </div>
                                    <span className="ml-2 text-sm font-medium min-w-[80px]">{formatCurrency(item.value)}</span>
                                    <span className="ml-1 text-xs text-slate-500 w-24 truncate">{item.name}</span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 pt-4 border-t">
                            <div className="flex justify-between items-center">
                                <span className="font-medium text-slate-800">Estimated Monthly Cost:</span>
                                <span className="font-bold text-lg text-slate-900">{formatCurrency(totalMonthlyCost)}</span>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <h3 className="text-lg font-medium text-slate-800 mb-4">Loan Breakdown</h3>
                        <div className="h-64 flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={[
                                            { name: 'Principal', value: summary.amountToFinance },
                                            { name: 'Interest', value: summary.totalInterest }
                                        ]}
                                        cx="50%" cy="50%" outerRadius={80} innerRadius={40} dataKey="value"
                                    >
                                        <Cell fill="#3b82f6" />
                                        <Cell fill="#94a3b8" />
                                    </Pie>
                                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                                    <Legend verticalAlign="bottom" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mt-4">
                            <div className="grid grid-cols-2 gap-y-2 text-sm text-slate-600">
                                <div>Total to Principal:</div>
                                <div className="text-right font-medium text-slate-900">{formatCurrency(summary.amountToFinance)}</div>
                                <div>Total in Interest:</div>
                                <div className="text-right font-medium text-slate-900">{formatCurrency(summary.totalInterest)}</div>
                            </div>
                        </div>
                        <Button variant="outline" className="w-full mt-4" onClick={() => window.print()}>
                            <PrinterIcon className="mr-2 h-4 w-4" /> Print Summary
                        </Button>
                    </Card>
                </div>
            </div>
        </div>
    );
}
