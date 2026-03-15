"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { v4 as uuidv4 } from 'uuid';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer
} from "recharts";
import {
    SaveIcon, ArrowLeft, TrashIcon, PencilIcon, DollarSign
} from "lucide-react";
import Link from "next/link";

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { HeaderHero } from "@/components/layout/header-hero";
import { KpiValue } from "@/components/ui/kpi-value";
import { KpiBlock } from "@/components/ui/kpi-block";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { ReceiptScanner } from "@/components/expenses/ReceiptScanner";
import { getExpenses, addExpense, deleteExpense, getTargetBudgets, setTargetBudget, updateExpense, batchAddExpenses } from "@/lib/actions/budget";
import { getFinancialData } from "@/app/actions/financials";

import {
    ExpenseItem,
    ExpenseGroup,
    ExpenseCategory,
    MonthlyBudget
} from "@/types";

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const CATEGORY_BY_GROUP: Record<string, string[]> = {
    'Essential': ['Campground', 'Water', 'Propane', 'Gasoline', 'Food', 'Personal Supplies', 'RV Supplies', 'Legal', 'Financial', 'Maintenance', 'Other'],
    'Non-essential': ['Campground', 'Recreation', 'Work', 'Personal Supplies', 'RV Supplies', 'Other'],
    'All Categories': ['Campground', 'Water', 'Propane', 'Gasoline', 'Food', 'Personal Supplies', 'RV Supplies', 'Legal', 'Financial', 'Recreation', 'Work', 'Maintenance', 'Other']
};

const expenseSchema = z.object({
    name: z.string().min(1, { message: "Expense name required" }),
    group: z.enum(['Essential', 'Non-essential'] as const),
    category: z.string().min(1),
    costPerItem: z.coerce.number().min(0),
    quantity: z.coerce.number().min(1, "Quantity must be at least 1").default(1),
    tax: z.coerce.number().min(0).default(0),
    gallons: z.coerce.number().min(0).optional(),
    odometerReading: z.coerce.number().min(0).optional()
});
type ExpenseFormValues = z.infer<typeof expenseSchema>;

import { getUserProfile } from "@/app/actions/profiles";

export default function RVBudgetPage() {
    const [isClient, setIsClient] = useState(false);
    const [planType, setPlanType] = useState<string | null>(null);

    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
    const [currentYear] = useState<number>(new Date().getFullYear());
    const [maintenanceBudget, setMaintenanceBudget] = useState<number>(2000);

    const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
    const [budgets, setBudgets] = useState<MonthlyBudget[]>([]);

    const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);

    const fetchBudgetData = async () => {
        const [expData, budData] = await Promise.all([
            getExpenses(currentYear),
            getTargetBudgets(currentYear)
        ]);

        const formattedBudgets = [];
        for (let m = 1; m <= 12; m++) {
            const dbBudget = budData.find((b: any) => b.month === m);
            formattedBudgets.push({ month: m, year: currentYear, budgetedAmount: dbBudget ? Number(dbBudget.amount) : 0 });
        }
        setBudgets(formattedBudgets);

        if (expData && expData.length > 0) {
            const formattedExt = expData.map((e: any) => ({
                id: e.id,
                name: e.name,
                group: 'Essential' as ExpenseGroup, // Defaulting for now as we don't store group
                category: e.category as ExpenseCategory,
                costPerItem: Number(e.amount),
                quantity: 1, // Defaulting as we don't store quantity
                tax: 0,
                month: e.month || new Date(e.createdAt).getMonth() + 1,
                year: e.year || new Date(e.createdAt).getFullYear(),
                gallons: e.gallons || 0,
                odometerReading: e.odometerReading || 0
            }));
            setExpenses(formattedExt);
        } else {
            setExpenses([]);
        }
    }

    useEffect(() => {
        setIsClient(true);

        async function checkAccess() {
            const res = await getUserProfile();
            if (res.success && res.data) {
                setPlanType(res.data.planType || 'full');
            }
        }
        checkAccess();
        fetchBudgetData();
    }, [currentYear]);

    const form = useForm<ExpenseFormValues>({
        resolver: zodResolver(expenseSchema) as any,
        defaultValues: { name: "", group: "Essential", category: "Campground", costPerItem: 0, quantity: 1, tax: 0, gallons: 0, odometerReading: 0 }
    });

    const getFilteredExpenses = () => expenses.filter(e => e.month === selectedMonth && e.year === currentYear);
    const getMonthBudget = () => budgets.find(b => b.month === selectedMonth && b.year === currentYear);

    const calculateTotal = (exp: ExpenseItem) => {
        const sub = exp.costPerItem * exp.quantity;
        return sub + (sub * exp.tax / 100);
    };

    const getMonthTotalExpenses = () => getFilteredExpenses().reduce((sum, e) => sum + calculateTotal(e), 0);
    const getAnnualBudgetTotal = () => budgets.reduce((sum, b) => sum + b.budgetedAmount, 0);
    const getYTDExpenses = () => expenses.reduce((sum, e) => sum + calculateTotal(e), 0);

    const percentUsed = getAnnualBudgetTotal() > 0 ? (getYTDExpenses() / getAnnualBudgetTotal()) * 100 : 0;
    const isBudgetOkay = percentUsed <= 100;
    const healthScore = Math.max(10, Math.round(100 - (percentUsed * (isBudgetOkay ? 0.15 : 0.9))));
    const healthStatus = healthScore >= 80 ? "Excellent" : healthScore >= 60 ? "Good" : healthScore >= 40 ? "Fair" : "Poor";

    const onExpenseSubmit = async (data: ExpenseFormValues) => {
        if (editingExpense) {
            const totalAmount = data.costPerItem * data.quantity;
            const finalAmount = totalAmount + (totalAmount * (data.tax / 100));

            try {
                await updateExpense(editingExpense.id, {
                    name: data.name,
                    category: data.category,
                    amount: finalAmount,
                    isFixed: false,
                    month: editingExpense.month,
                    year: editingExpense.year,
                    group: data.group,
                    costPerItem: data.costPerItem,
                    quantity: data.quantity,
                    tax: data.tax,
                    gallons: data.gallons,
                    odometerReading: data.odometerReading,
                    isFuelEvent: data.category === 'Gasoline',
                    isPropaneEvent: data.category === 'Propane'
                });

                setExpenses(expenses.map(e => e.id === editingExpense.id ? { ...e, ...data, costPerItem: data.costPerItem, quantity: data.quantity, tax: data.tax, category: data.category as ExpenseCategory } : e));
                setEditingExpense(null);
                toast.success("Expense updated in database");
            } catch (e: any) {
                toast.error(e.message);
            }
        } else {
            const totalAmount = data.costPerItem * data.quantity;
            const finalAmount = totalAmount + (totalAmount * (data.tax / 100));

            try {
                const newId = await addExpense({
                    name: data.name,
                    category: data.category,
                    amount: finalAmount,
                    isFixed: false,
                    month: selectedMonth,
                    year: currentYear,
                    group: data.group,
                    costPerItem: data.costPerItem,
                    quantity: data.quantity,
                    tax: data.tax,
                    gallons: data.gallons,
                    odometerReading: data.odometerReading,
                    isFuelEvent: data.category === 'Gasoline',
                    isPropaneEvent: data.category === 'Propane' // Keep structure for future logic if needed
                });

                setExpenses([...expenses, { ...data, category: data.category as ExpenseCategory, id: newId, month: selectedMonth, year: currentYear }]);
                toast.success("Expense saved to database");
            } catch (e: any) {
                toast.error(e.message);
            }
        }
        form.reset({ name: "", group: "Essential", category: "Campground", costPerItem: 0, quantity: 1, tax: 0, gallons: 0, odometerReading: 0 });
    };

    const editExpense = (exp: ExpenseItem) => {
        setEditingExpense(exp);
        form.reset({ name: exp.name, group: exp.group, category: exp.category, costPerItem: exp.costPerItem, quantity: exp.quantity, tax: exp.tax, gallons: exp.gallons || 0, odometerReading: exp.odometerReading || 0 });

        // Auto-scroll the page up so the edit form is visible on mobile devices
        window.scrollTo({ top: 200, behavior: 'smooth' });
    };

    const handleDeleteExpense = async (id: string) => {
        try {
            await deleteExpense(id);
            setExpenses(expenses.filter(e => e.id !== id));
            toast.success("Expense deleted from database");
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    const handleUpdateBudget = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value) || 0;
        setBudgets(budgets.map(b => (b.month === selectedMonth && b.year === currentYear) ? { ...b, budgetedAmount: val } : b));

        try {
            await setTargetBudget(selectedMonth, currentYear, val);
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    const applyBudgetToAllMonths = async () => {
        const currentTarget = budgets.find(b => b.month === selectedMonth && b.year === currentYear)?.budgetedAmount || 0;
        setBudgets(budgets.map(b => ({ ...b, budgetedAmount: currentTarget })));

        try {
            const promises = Array.from({ length: 12 }, (_, i) => i + 1).map(m => setTargetBudget(m, currentYear, currentTarget));
            await Promise.all(promises);
            toast.success(`Saved ${formatCurrency(currentTarget)} as target for all 12 months`);
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    const autoPopulateFixedCosts = async () => {
        // Fetch real financial data from the purchase calculator
        const finRes = await getFinancialData();
        let monthlyLoan = 0;
        let monthlyInsurance = 0;
        let monthlyRegistration = 0;

        if (finRes.success && finRes.data) {
            const d = finRes.data;
            const principal = (Number(d.purchasePrice) || 0) + (Number(d.accessories) || 0) + (Number(d.extendedWarranty) || 0) + (Number(d.registrationFees) || 0) - (Number(d.downPayment) || 0) - (Number(d.tradeInValue) || 0);
            const rate = (Number(d.interestRate) || 0) / 100 / 12;
            const months = (d.loanTermYears || 5) * 12;

            if (rate > 0 && principal > 0) {
                monthlyLoan = Math.round((principal * rate * Math.pow(1 + rate, months)) / (Math.pow(1 + rate, months) - 1) * 100) / 100;
            } else if (principal > 0) {
                monthlyLoan = Math.round(principal / months * 100) / 100;
            }

            monthlyInsurance = Math.round((Number(d.insurance) || 0) / 12 * 100) / 100;
            monthlyRegistration = Math.round((Number(d.registrationFees) || 0) / 12 * 100) / 100;
        }

        if (monthlyLoan === 0 && monthlyInsurance === 0 && monthlyRegistration === 0) {
            toast.error("No financial data found. Please complete the Purchase Calculator first.");
            return;
        }

        const monthlyMaintenance = maintenanceBudget / 12;

        const newExpenses = [...expenses];
        const toAdd = [];
        for (let m = 1; m <= 12; m++) {
            const monthDeps = newExpenses.filter(e => e.month === m && e.year === currentYear);
            const hasLoan = monthDeps.some(e => e.name === 'RV Loan Payment');
            if (!hasLoan) {
                const loanE = { id: uuidv4(), name: 'RV Loan Payment', group: 'Essential', category: 'Financial', costPerItem: monthlyLoan, quantity: 1, tax: 0, month: m, year: currentYear };
                const insE = { id: uuidv4(), name: 'RV Insurance', group: 'Essential', category: 'Financial', costPerItem: monthlyInsurance, quantity: 1, tax: 0, month: m, year: currentYear };
                const regE = { id: uuidv4(), name: 'RV Registration', group: 'Essential', category: 'Legal', costPerItem: monthlyRegistration, quantity: 1, tax: 0, month: m, year: currentYear };
                const mainE = { id: uuidv4(), name: 'RV Maintenance', group: 'Essential', category: 'Maintenance', costPerItem: monthlyMaintenance, quantity: 1, tax: 0, month: m, year: currentYear };

                newExpenses.push(loanE as any, insE as any, regE as any, mainE as any);
                toAdd.push(loanE, insE, regE, mainE);
            }
        }

        try {
            await batchAddExpenses(toAdd);
            setExpenses(newExpenses);
            toast.success("Populated fixed monthly costs from your Purchase Calculator data!");
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    const chartData = useMemo(() => MONTH_NAMES.map((name, idx) => {
        const month = idx + 1;
        const mBudget = budgets.find(b => b.month === month && b.year === currentYear)?.budgetedAmount || 0;
        const mActual = expenses.filter(e => e.month === month && e.year === currentYear).reduce((sum, e) => sum + calculateTotal(e), 0);
        return { name: name.substring(0, 3), budget: mBudget, actual: mActual };
    }), [budgets, expenses, currentYear]);

    if (!isClient) return null;

    if (planType === 'starter') {
        return (
            <div className="container mx-auto py-20 px-4 text-center max-w-2xl">
                <Card className="p-12 border-2 border-dashed border-amber-200 bg-amber-50">
                    <CardHeader>
                        <DollarSign className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                        <CardTitle className="text-3xl font-bold text-amber-900">Pro Feature Restricted</CardTitle>
                        <CardDescription className="text-lg text-amber-800">
                            The full <strong>RV Living Budget</strong> suite is only available to Monthly and Annual Pro subscribers.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-amber-700">
                            Your Starter Pack gives you full access to all <strong>Setup & Build</strong> features (Purchase Calculator, Solar & Power, Water Systems) for 90 days.
                        </p>
                        <p className="text-amber-700 font-medium">
                            To unlock expense tracking, fuel economy, and intelligent budgeting, please consider upgrading to a Pro plan.
                        </p>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                        <Button asChild className="w-full bg-amber-600 hover:bg-amber-700 text-white py-6 text-lg font-bold">
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
                title="RV Living Budget"
                description="Manage your monthly expenses, track your annual budget, and analyze your financial health for RV living."
                imageUrl="/images/page-headers/living-budget-header.jpg"
            />

            {/* Summary Dash */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 mt-2">
                <KpiBlock label="Annual Budget" variant="primary">
                    <KpiValue>{formatCurrency(getAnnualBudgetTotal())}</KpiValue>
                </KpiBlock>
                <KpiBlock label="YTD Expenses" variant="accent">
                    <KpiValue>{formatCurrency(getYTDExpenses())}</KpiValue>
                </KpiBlock>
                <KpiBlock label="Budget Used" variant="primary">
                    <div className={`font-bold text-3xl ${!isBudgetOkay ? 'text-red-500' : 'text-brand-primary'} relative z-10`}>{formatNumber(percentUsed, 1)}%</div>
                    <div className="text-xs text-slate-500 mt-1 relative z-10">{isBudgetOkay ? "On track" : "Over budget"}</div>
                </KpiBlock>
                <KpiBlock label="YTD to Budget Health" variant="accent">
                    <KpiValue>{healthScore}/100</KpiValue>
                    <div className="text-xs text-slate-500 mt-1 relative z-10">{healthStatus}</div>
                </KpiBlock>
            </div>

            <Tabs defaultValue="expenses">
                <div className="grid lg:grid-cols-3 gap-6 mb-6 items-center">
                    <div className="lg:col-span-2">
                        <TabsList className="grid w-full grid-cols-3 bg-transparent h-auto gap-2 p-0 shadow-none border-0">
                            <TabsTrigger
                                value="expenses"
                                className="h-11 px-6 border border-purple-200 bg-gradient-to-b from-purple-50 to-purple-100/50 text-purple-900 data-[state=active]:from-white data-[state=active]:to-purple-50 data-[state=active]:border-purple-600 data-[state=active]:text-purple-700 data-[state=active]:shadow-md font-semibold transition-all rounded-md whitespace-nowrap"
                            >
                                Expenses
                            </TabsTrigger>
                            <TabsTrigger
                                value="planning"
                                className="h-11 px-6 border border-purple-200 bg-gradient-to-b from-purple-50 to-purple-100/50 text-purple-900 data-[state=active]:from-white data-[state=active]:to-purple-50 data-[state=active]:border-purple-600 data-[state=active]:text-purple-700 data-[state=active]:shadow-md font-semibold transition-all rounded-md whitespace-nowrap"
                            >
                                Budget Planning
                            </TabsTrigger>
                            <TabsTrigger
                                value="charts"
                                className="h-11 px-6 border border-purple-200 bg-gradient-to-b from-purple-50 to-purple-100/50 text-purple-900 data-[state=active]:from-white data-[state=active]:to-purple-50 data-[state=active]:border-purple-600 data-[state=active]:text-purple-700 data-[state=active]:shadow-md font-semibold transition-all rounded-md whitespace-nowrap"
                            >
                                Annual Analysis
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="lg:col-span-1 flex justify-end">
                        <div className="flex items-center gap-3">
                            <Label className="text-sm font-medium text-slate-500">Viewing Month:</Label>
                            <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                                <SelectTrigger className="w-[180px] bg-white h-11 border-purple-200 shadow-sm"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {MONTH_NAMES.map((m, idx) => <SelectItem key={m} value={(idx + 1).toString()}>{m}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <TabsContent value="expenses" className="space-y-6">
                    <div className="grid lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-1 space-y-6">
                            <Card className="p-6 sticky top-6">
                                <div className="mb-6 mb-8 border-b border-slate-100 pb-6">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Snap & Auto-Fill</h4>
                                    <div className="w-full max-w-sm">
                                        <ReceiptScanner planType={planType || 'full'} />
                                    </div>
                                </div>
                                <h3 className="text-lg font-medium text-slate-800 mb-4">{editingExpense ? "Edit" : "Add"} Expense</h3>
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onExpenseSubmit)} className="space-y-4">
                                        <FormField control={form.control} name="name" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Expense Name</FormLabel>
                                                <FormControl><Input placeholder="Campsite Fee" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField control={form.control} name="group" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Group</FormLabel>
                                                    <Select onValueChange={(v) => { field.onChange(v); form.setValue('category', CATEGORY_BY_GROUP[v][0]); }} value={field.value}>
                                                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="Essential">Essential</SelectItem>
                                                            <SelectItem value="Non-essential">Non-essential</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <FormField control={form.control} name="category" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Category</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                        <SelectContent>
                                                            {CATEGORY_BY_GROUP[form.getValues('group')].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        </div>

                                        {(form.watch('category') === 'Gasoline' || form.watch('category') === 'Propane') && (
                                            <div className="grid grid-cols-2 gap-4">
                                                <FormField
                                                    control={form.control}
                                                    name="gallons"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Gallons Added</FormLabel>
                                                            <FormControl>
                                                                <Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                {form.watch('category') === 'Gasoline' && (
                                                    <FormField
                                                        control={form.control}
                                                        name="odometerReading"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Odometer Reading</FormLabel>
                                                                <FormControl>
                                                                    <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                )}
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField control={form.control} name="costPerItem" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Cost ($)</FormLabel>
                                                    <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <FormField control={form.control} name="quantity" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Quantity</FormLabel>
                                                    <FormControl><Input type="number" step="1" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        </div>
                                        <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100 mt-2">
                                            <span className="text-sm font-medium">Estimated Total:</span>
                                            <span className="font-bold">{formatCurrency((form.watch('costPerItem') || 0) * (form.watch('quantity') || 1))}</span>
                                        </div>
                                        <div className="flex justify-end gap-2 pt-2">
                                            {editingExpense && (
                                                <Button type="button" variant="outline" onClick={() => { setEditingExpense(null); form.reset(); }}>
                                                    Cancel
                                                </Button>
                                            )}
                                            <Button type="submit" className="bg-purple-600 hover:bg-purple-700 w-full">
                                                {editingExpense ? "Save Changes" : "Record Expense"}
                                            </Button>
                                        </div>
                                    </form>
                                </Form>
                            </Card>

                            <Card className="p-6">
                                <h3 className="text-lg font-medium text-slate-800 mb-2">Auto-Populate Fixed Costs</h3>
                                <p className="text-sm text-slate-500 mb-4">Automatically fill your ledger with recurring monthly costs like your RV Loan, Insurance, Registration, and Maintenance averages.</p>
                                <Button onClick={autoPopulateFixedCosts} variant="secondary" className="w-full">Populate 12-Month Averages</Button>
                            </Card>
                        </div>

                        <div className="lg:col-span-2">
                            <Card className="p-0 overflow-hidden h-full flex flex-col">
                                <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                                    <h3 className="text-lg font-medium text-slate-800">
                                        {MONTH_NAMES[selectedMonth - 1]} Ledger
                                    </h3>
                                    <div className="text-sm bg-white px-3 py-1 rounded-md border font-medium">
                                        Total: <span className="text-purple-600 ml-1">{formatCurrency(getMonthTotalExpenses())}</span>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-auto p-0">
                                    {getFilteredExpenses().length === 0 ? (
                                        <div className="p-12 text-center text-slate-500 italic">No expenses recorded for this month.</div>
                                    ) : (
                                        <div className="divide-y divide-slate-100">
                                            {getFilteredExpenses().sort((a, b) => calculateTotal(b) - calculateTotal(a)).map((exp) => {
                                                const isEditing = editingExpense?.id === exp.id;
                                                return (
                                                    <div
                                                        key={exp.id}
                                                        className={`p-4 flex items-center justify-between transition-all duration-200 ${isEditing
                                                            ? 'bg-purple-50 border-l-4 border-purple-500 rounded-r-md'
                                                            : 'hover:bg-slate-50'
                                                            }`}
                                                    >
                                                        <div>
                                                            <div className={`font-medium ${isEditing ? 'text-purple-900' : 'text-slate-800'}`}>
                                                                {exp.name} {isEditing && <span className="text-xs ml-2 bg-purple-200 text-purple-700 px-2 py-0.5 rounded-full">Editing</span>}
                                                            </div>
                                                            <div className="text-sm text-slate-500">
                                                                {exp.group} • {exp.category} • {exp.quantity}x {formatCurrency(exp.costPerItem)}
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-4">
                                                            <div className={`font-bold text-right min-w-[5rem] ${isEditing ? 'text-purple-700' : 'text-slate-700'}`}>
                                                                {formatCurrency(calculateTotal(exp))}
                                                            </div>
                                                            <div className="flex gap-1">
                                                                <Button
                                                                    variant={isEditing ? 'secondary' : 'ghost'}
                                                                    size="icon"
                                                                    className={`h-8 w-8 ${isEditing ? 'bg-purple-200 text-purple-700' : 'text-slate-400 hover:text-blue-600'}`}
                                                                    onClick={() => editExpense(exp)}
                                                                >
                                                                    <PencilIcon className="h-4 w-4" />
                                                                </Button>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600" onClick={() => handleDeleteExpense(exp.id)}>
                                                                    <TrashIcon className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="planning" className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <Card className="p-6">
                            <h3 className="text-lg font-medium text-slate-800 mb-4">{MONTH_NAMES[selectedMonth - 1]} Monthly Target Budget</h3>
                            <p className="text-sm text-slate-500 mb-6">Set your monthly budget target for RV expenses. This gives you a ceiling to compare your actual expenses against.</p>

                            <div className="space-y-4">
                                <div className="flex flex-col gap-2">
                                    <Label>Monthly Budget Amount ($)</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            type="number"
                                            value={getMonthBudget()?.budgetedAmount || ""}
                                            onChange={handleUpdateBudget}
                                            className="text-lg font-medium h-12"
                                        />
                                        <Button
                                            variant="outline"
                                            onClick={applyBudgetToAllMonths}
                                            className="h-12 border-purple-200 text-purple-700 hover:bg-purple-50"
                                            title="Apply this amount to all 12 months"
                                        >
                                            Apply to All Months
                                        </Button>
                                    </div>
                                </div>

                                <div className="bg-slate-50 p-4 rounded-lg mt-6 border border-slate-100 space-y-3">
                                    <h4 className="font-medium text-sm text-slate-800">Month Summary</h4>
                                    <div className="flex justify-between text-sm">
                                        <span>Target:</span>
                                        <span className="font-medium">{formatCurrency(getMonthBudget()?.budgetedAmount || 0)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Expenses:</span>
                                        <span className="font-medium">{formatCurrency(getMonthTotalExpenses())}</span>
                                    </div>
                                    <div className="border-t pt-2 flex justify-between text-sm font-bold">
                                        <span>Remaining:</span>
                                        <span className={(getMonthBudget()?.budgetedAmount || 0) - getMonthTotalExpenses() < 0 ? 'text-red-500' : 'text-emerald-600'}>
                                            {formatCurrency((getMonthBudget()?.budgetedAmount || 0) - getMonthTotalExpenses())}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <div className="space-y-6">
                            <Card className="p-6">
                                <h3 className="text-lg font-medium text-slate-800 mb-2">Auto-Populate Fixed Costs</h3>
                                <p className="text-sm text-slate-500 mb-4">Automatically fill your ledger with recurring monthly costs like your RV Loan, Insurance, Registration, and Maintenance averages.</p>
                                <Button onClick={autoPopulateFixedCosts} variant="secondary" className="w-full">Populate 12-Month Averages</Button>
                            </Card>

                            <Card className="p-6">
                                <h3 className="text-lg font-medium text-slate-800 mb-2">Annual Maintenance</h3>
                                <p className="text-sm text-slate-500 mb-4">A good rule of thumb is 2-3% of your RV&apos;s purchase price annually. We&apos;ll divide this by 12 for your monthly maintenance budget.</p>
                                <div className="flex gap-2">
                                    <Input type="number" value={maintenanceBudget} onChange={e => setMaintenanceBudget(parseFloat(e.target.value) || 0)} />
                                    <Button variant="outline" onClick={() => toast.success("Maintenance budget updated")}>Set</Button>
                                </div>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="charts" className="space-y-6">
                    <Card className="p-6">
                        <h3 className="text-lg font-medium text-slate-800 mb-6">Annual Budget Overview ({currentYear})</h3>
                        <div className="h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} />
                                    <YAxis tickFormatter={(val) => `$${val}`} axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} />
                                    <RechartsTooltip cursor={{ fill: '#F1F5F9' }} formatter={(value: any) => formatCurrency(Number(value) || 0)} />
                                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                    <Bar dataKey="budget" name="Budget Ceiling" fill="#CBD5E1" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="actual" name="Actual Expenses" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
