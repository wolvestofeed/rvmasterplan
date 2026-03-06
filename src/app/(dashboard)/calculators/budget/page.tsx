"use client";

import { useState, useEffect } from "react";
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

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { HeaderHero } from "@/components/layout/header-hero";
import { formatCurrency, formatNumber } from "@/lib/utils";

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

const CATEGORY_BY_GROUP: Record<string, ExpenseCategory[]> = {
    'Essential': ['Campground', 'Water', 'Propane', 'Food', 'Personal Supplies', 'RV Supplies', 'Legal', 'Financial', 'Maintenance', 'Other'],
    'Non-essential': ['Campground', 'Recreation', 'Work', 'Personal Supplies', 'RV Supplies', 'Other'],
    'All Categories': ['Campground', 'Water', 'Propane', 'Food', 'Personal Supplies', 'RV Supplies', 'Legal', 'Financial', 'Recreation', 'Work', 'Maintenance', 'Other']
};

const expenseSchema = z.object({
    name: z.string().min(1, { message: "Expense name required" }),
    group: z.enum(['Essential', 'Non-essential'] as const),
    category: z.string().min(1),
    costPerItem: z.coerce.number().min(0),
    quantity: z.coerce.number().min(1),
    tax: z.coerce.number().min(0),
});
type ExpenseFormValues = z.infer<typeof expenseSchema>;

export default function RVBudgetPage() {
    const [isClient, setIsClient] = useState(false);

    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
    const [currentYear] = useState<number>(new Date().getFullYear());
    const [maintenanceBudget, setMaintenanceBudget] = useState<number>(2000);

    const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
    const [budgets, setBudgets] = useState<MonthlyBudget[]>([]);

    const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);

    useEffect(() => {
        setIsClient(true);
        // Initialize default empty budgets
        const initialBudgets = [];
        for (let m = 1; m <= 12; m++) {
            initialBudgets.push({ month: m, year: currentYear, budgetedAmount: 0 });
        }
        setBudgets(initialBudgets);

        // Add some mock expenses to populate the demo view
        setExpenses([
            { id: "1", name: "State Park Fee", group: "Essential", category: "Campground", costPerItem: 35, quantity: 4, tax: 0, month: new Date().getMonth() + 1, year: currentYear },
            { id: "2", name: "Groceries", group: "Essential", category: "Food", costPerItem: 120, quantity: 2, tax: 0, month: new Date().getMonth() + 1, year: currentYear },
            { id: "3", name: "Propane Fill", group: "Essential", category: "Propane", costPerItem: 22, quantity: 1, tax: 0, month: new Date().getMonth() + 1, year: currentYear },
            { id: "4", name: "Starlink", group: "Non-essential", category: "Work", costPerItem: 150, quantity: 1, tax: 0, month: new Date().getMonth() + 1, year: currentYear },
            { id: "5", name: "National Parks Pass", group: "Non-essential", category: "Recreation", costPerItem: 80, quantity: 1, tax: 0, month: new Date().getMonth() + 1, year: currentYear }
        ]);
    }, [currentYear]);

    const form = useForm<ExpenseFormValues>({
        resolver: zodResolver(expenseSchema) as any,
        defaultValues: { name: "", group: "Essential", category: "Campground", costPerItem: 0, quantity: 1, tax: 0 }
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

    const onExpenseSubmit = (data: ExpenseFormValues) => {
        if (editingExpense) {
            setExpenses(expenses.map(e => e.id === editingExpense.id ? { ...e, ...data, category: data.category as ExpenseCategory } : e));
            setEditingExpense(null);
            toast.success("Expense updated");
        } else {
            setExpenses([...expenses, { ...data, category: data.category as ExpenseCategory, id: uuidv4(), month: selectedMonth, year: currentYear }]);
            toast.success("Expense added");
        }
        form.reset({ name: "", group: "Essential", category: "Campground", costPerItem: 0, quantity: 1, tax: 0 });
    };

    const editExpense = (exp: ExpenseItem) => {
        setEditingExpense(exp);
        form.reset({ name: exp.name, group: exp.group, category: exp.category, costPerItem: exp.costPerItem, quantity: exp.quantity, tax: exp.tax });

        // Auto-scroll the page up so the edit form is visible on mobile devices
        window.scrollTo({ top: 200, behavior: 'smooth' });
    };

    const deleteExpense = (id: string) => {
        setExpenses(expenses.filter(e => e.id !== id));
        toast.success("Expense removed");
    };

    const handleUpdateBudget = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value) || 0;
        setBudgets(budgets.map(b => (b.month === selectedMonth && b.year === currentYear) ? { ...b, budgetedAmount: val } : b));
    };

    const applyBudgetToAllMonths = () => {
        const currentTarget = budgets.find(b => b.month === selectedMonth && b.year === currentYear)?.budgetedAmount || 0;
        setBudgets(budgets.map(b => ({ ...b, budgetedAmount: currentTarget })));
        toast.success(`Set ${formatCurrency(currentTarget)} as target for all 12 months`);
    };

    const autoPopulateFixedCosts = () => {
        // Generate mock costs based on purchase calculator loan logic
        const mockLoan = 450;
        const mockInsurance = 120;
        const mockRegistration = 35;
        const monthlyMaintenance = maintenanceBudget / 12;

        const newExpenses = [...expenses];
        for (let m = 1; m <= 12; m++) {
            const monthDeps = newExpenses.filter(e => e.month === m && e.year === currentYear);
            const hasLoan = monthDeps.some(e => e.name === 'RV Loan Payment');
            if (!hasLoan) {
                newExpenses.push({ id: uuidv4(), name: 'RV Loan Payment', group: 'Essential', category: 'Financial', costPerItem: mockLoan, quantity: 1, tax: 0, month: m, year: currentYear });
                newExpenses.push({ id: uuidv4(), name: 'RV Insurance', group: 'Essential', category: 'Financial', costPerItem: mockInsurance, quantity: 1, tax: 0, month: m, year: currentYear });
                newExpenses.push({ id: uuidv4(), name: 'RV Registration', group: 'Essential', category: 'Legal', costPerItem: mockRegistration, quantity: 1, tax: 0, month: m, year: currentYear });
                newExpenses.push({ id: uuidv4(), name: 'RV Maintenance', group: 'Essential', category: 'Maintenance', costPerItem: monthlyMaintenance, quantity: 1, tax: 0, month: m, year: currentYear });
            }
        }
        setExpenses(newExpenses);
        toast.success("Populated fixed monthly costs across all 12 months!");
    };

    const chartData = MONTH_NAMES.map((name, idx) => {
        const month = idx + 1;
        const mBudget = budgets.find(b => b.month === month && b.year === currentYear)?.budgetedAmount || 0;
        const mActual = expenses.filter(e => e.month === month && e.year === currentYear).reduce((sum, e) => sum + calculateTotal(e), 0);
        return { name: name.substring(0, 3), budget: mBudget, actual: mActual };
    });

    if (!isClient) return null;

    return (
        <div className="container mx-auto py-10 px-4 md:px-8 max-w-6xl">
            <HeaderHero
                title="RV Living Budget"
                description="Manage your monthly expenses, track your annual budget, and analyze your financial health for RV living."
                imageUrl="/images/page-headers/living-budget-header.jpg"
            />

            <div className="flex flex-col md:flex-row md:items-center justify-end mt-2 mb-8 gap-4">
                <div className="flex items-center gap-3">
                    <Label className="text-sm font-medium">Viewing Month:</Label>
                    <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                        <SelectTrigger className="w-[160px] bg-white"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {MONTH_NAMES.map((m, idx) => <SelectItem key={m} value={(idx + 1).toString()}>{m}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Summary Dash */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <Card className="bg-gradient-to-br from-white/90 via-white/40 to-[#2a4f3f]/30 p-4 rounded-lg border-2 border-[#2a4f3f]/20 shadow-[4px_4px_12px_rgba(0,0,0,0.15)] relative overflow-hidden">
                    <CardHeader className="pb-2 relative z-10 p-0 mb-1"><CardTitle className="text-sm text-slate-500 font-medium">Annual Budget</CardTitle></CardHeader>
                    <CardContent className="p-0 relative z-10"><div className="text-2xl font-bold text-[#2a4f3f]">{formatCurrency(getAnnualBudgetTotal())}</div></CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-white/90 via-white/40 to-[#8ca163]/40 p-4 rounded-lg border-2 border-[#8ca163]/20 shadow-[4px_4px_12px_rgba(0,0,0,0.15)] relative overflow-hidden">
                    <CardHeader className="pb-2 relative z-10 p-0 mb-1"><CardTitle className="text-sm text-slate-500 font-medium">YTD Expenses</CardTitle></CardHeader>
                    <CardContent className="p-0 relative z-10"><div className="text-2xl font-bold text-[#2a4f3f]">{formatCurrency(getYTDExpenses())}</div></CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-white/90 via-white/40 to-[#2a4f3f]/30 p-4 rounded-lg border-2 border-[#2a4f3f]/20 shadow-[4px_4px_12px_rgba(0,0,0,0.15)] relative overflow-hidden">
                    <CardHeader className="pb-2 relative z-10 p-0 mb-1"><CardTitle className="text-sm text-slate-500 font-medium">Budget Used</CardTitle></CardHeader>
                    <CardContent className="p-0 relative z-10">
                        <div className={`text-2xl font-bold ${!isBudgetOkay ? 'text-red-500' : 'text-[#2a4f3f]'}`}>{formatNumber(percentUsed, 1)}%</div>
                        <div className="text-xs text-slate-500 mt-1">{isBudgetOkay ? "On track" : "Over budget"}</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-white/90 via-white/40 to-[#8ca163]/40 p-4 rounded-lg border-2 border-[#8ca163]/20 shadow-[4px_4px_12px_rgba(0,0,0,0.15)] relative overflow-hidden">
                    <CardHeader className="pb-2 relative z-10 p-0 mb-1"><CardTitle className="text-sm text-slate-500 font-medium">Financial Health</CardTitle></CardHeader>
                    <CardContent className="p-0 relative z-10">
                        <div className="text-2xl font-bold text-[#2a4f3f]">{healthScore}/100</div>
                        <div className="text-xs text-slate-500 mt-1">{healthStatus}</div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="expenses">
                <TabsList className="mb-6 grid w-full grid-cols-3 max-w-md">
                    <TabsTrigger value="expenses">Expenses</TabsTrigger>
                    <TabsTrigger value="planning">Budget Planning</TabsTrigger>
                    <TabsTrigger value="charts">Annual Analysis</TabsTrigger>
                </TabsList>

                <TabsContent value="expenses" className="space-y-6">
                    <div className="grid lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-1 space-y-6">
                            <Card className="p-6 sticky top-6">
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
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600" onClick={() => deleteExpense(exp.id)}>
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
