"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    SaveIcon,
    ArrowLeft,
    TrashIcon,
    PlusIcon,
    PencilIcon,
    ListIcon,
    DollarSignIcon,
    CheckCircle2Icon,
    CircleIcon
} from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { SetupItem, SetupItemCategory, SetupItemPriority } from "@/types";
import { mockSetupItems } from "@/data/mockData";
import { toast } from "sonner";
import { formatCurrency, formatNumber } from "@/lib/utils";

const CATEGORIES: SetupItemCategory[] = [
    'ENERGY', 'TOWING', 'BRAKES', 'WATER', 'STORAGE', 'RENOVATIONS', 'SECURITY', 'OTHER'
];
const PRIORITIES: SetupItemPriority[] = ['Must Have', 'Nice to Have', 'Future Upgrade'];

const setupItemSchema = z.object({
    name: z.string().min(1, { message: "Item name is required" }),
    category: z.string().min(1, { message: "Category is required" }),
    cost: z.coerce.number().min(0, { message: "Cost must be a positive number" }),
    priority: z.enum(['Must Have', 'Nice to Have', 'Future Upgrade']),
    acquired: z.boolean().default(false),
    weight: z.coerce.number().optional().default(0),
    notes: z.string().optional()
});

type SetupItemFormValues = z.infer<typeof setupItemSchema>;

const COLORS = ['#3b82f6', '#14b8a6', '#10b981', '#f59e0b', '#8b5cf6', '#f43f5e', '#ef4444', '#64748b'];

export default function RVSetupBudgetPage() {
    const [isClient, setIsClient] = useState(false);
    const [items, setItems] = useState<SetupItem[]>(mockSetupItems);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [summary, setSummary] = useState({
        totalCost: 0,
        acquiredCost: 0,
        remainingCost: 0,
        totalItems: 0,
        acquiredItems: 0,
        totalWeight: 0
    });

    useEffect(() => { setIsClient(true); }, []);

    const form = useForm<SetupItemFormValues>({
        resolver: zodResolver(setupItemSchema) as any,
        defaultValues: {
            name: "",
            category: "OTHER",
            cost: 0,
            priority: "Nice to Have",
            acquired: false,
            weight: 0,
            notes: ""
        }
    });

    useEffect(() => {
        // Recalculate summary metrics whenever items change
        let totalC = 0, acquiredC = 0, remainingC = 0;
        let acquiredI = 0;
        let totalW = 0;

        items.forEach(item => {
            totalC += item.cost;
            totalW += item.weight || 0;
            if (item.acquired) {
                acquiredC += item.cost;
                acquiredI++;
            } else {
                remainingC += item.cost;
            }
        });

        setSummary({
            totalCost: totalC,
            acquiredCost: acquiredC,
            remainingCost: remainingC,
            totalItems: items.length,
            acquiredItems: acquiredI,
            totalWeight: totalW
        });
    }, [items]);

    const onSubmitItem = (data: SetupItemFormValues) => {
        const itemData: SetupItem = {
            ...data,
            id: editingId || Date.now().toString(),
            category: data.category as SetupItemCategory,
            priority: data.priority as SetupItemPriority,
        };

        if (editingId) {
            setItems(items.map(a => a.id === editingId ? itemData : a));
            setEditingId(null);
            toast.success("Item updated");
        } else {
            setItems([...items, itemData]);
            toast.success("Item added");
        }
        form.reset({
            name: "",
            category: "OTHER",
            cost: 0,
            priority: "Nice to Have",
            acquired: false,
            weight: 0,
            notes: ""
        });
    };

    const editItem = (id: string) => {
        const itm = items.find(a => a.id === id);
        if (itm) {
            setEditingId(id);
            form.reset({
                name: itm.name,
                category: itm.category,
                cost: itm.cost,
                priority: itm.priority,
                acquired: itm.acquired,
                weight: itm.weight || 0,
                notes: itm.notes || ""
            });
            window.scrollTo({ top: 200, behavior: 'smooth' });
        }
    };

    const deleteItem = (id: string) => {
        setItems(items.filter(a => a.id !== id));
        toast.success("Item removed");
    };

    const toggleAcquired = (id: string) => {
        setItems(items.map(a => a.id === id ? { ...a, acquired: !a.acquired } : a));
    };

    const saveOverallData = () => {
        toast.success("Setup budget saved temporarily for demo mode!");
    };

    // Pie chart data by category (Cost)
    const costByCategory = items.reduce((acc, curr) => {
        acc[curr.category] = (acc[curr.category] || 0) + curr.cost;
        return acc;
    }, {} as Record<string, number>);

    const chartData = Object.entries(costByCategory)
        .map(([name, value]) => ({ name, value }))
        .filter(d => d.value > 0);

    if (!isClient) return null;

    return (
        <div className="container mx-auto py-10 px-4 md:px-8 max-w-6xl">
            <div className="mb-6">
                <Button variant="ghost" asChild className="-ml-4 text-muted-foreground hover:text-foreground">
                    <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Link>
                </Button>
            </div>

            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-heading font-bold text-gray-900 flex items-center">
                    <ListIcon className="mr-3 h-8 w-8 text-emerald-500" />
                    RV Setup Budget & Purchase Plan
                </h1>
                <Button onClick={saveOverallData} className="flex items-center">
                    <SaveIcon className="mr-2 h-4 w-4" /> Save Plan
                </Button>
            </div>

            {/* Hero Banner */}
            <div className="rounded-2xl overflow-hidden mb-8 relative bg-emerald-900 min-h-[200px]">
                <div className="absolute inset-0 bg-gradient-to-r from-teal-900 to-emerald-900 p-8 flex items-end">
                    <div className="text-white max-w-lg">
                        <h2 className="text-2xl font-bold mb-2 flex items-center">
                            Plan Your Rig's Loadout
                        </h2>
                        <p className="mb-4 text-emerald-100">
                            Track items needed to set up your RV for full-time living. Monitor costs, priorities, and what you've already acquired.
                        </p>
                    </div>
                </div>
            </div>

            {/* Dashboard Summary Cards */}
            <Card className="p-6 bg-slate-50 border border-slate-200 mb-6 border-t-2 border-t-teal-500 shadow-md shadow-teal-900/5">
                <h3 className="text-lg font-medium text-slate-800 mb-4">Purchase Plan Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm text-slate-800 text-center">
                        <div className="text-sm text-slate-500 mb-1">Total Estimated Cost</div>
                        <div className="font-bold text-3xl text-slate-700">{formatCurrency(summary.totalCost)}</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm text-slate-800 text-center">
                        <div className="text-sm text-slate-500 mb-1">Spent / Acquired</div>
                        <div className="font-bold text-3xl text-teal-600">{formatCurrency(summary.acquiredCost)}</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm text-slate-800 text-center">
                        <div className="text-sm text-slate-500 mb-1">Remaining to Purchase</div>
                        <div className="font-bold text-3xl text-orange-600">{formatCurrency(summary.remainingCost)}</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm text-slate-800 text-center">
                        <div className="text-sm text-slate-500 mb-1">Added Weight</div>
                        <div className="font-bold text-3xl text-blue-600">{formatNumber(summary.totalWeight, 1)} lbs</div>
                    </div>
                </div>
            </Card>

            <div className="grid lg:grid-cols-3 gap-6">

                {/* Left Column - Form & Chart */}
                <div className="space-y-6 lg:col-span-1">

                    <Card className="p-6">
                        <h3 className="text-lg font-medium text-slate-800 mb-4 flex items-center">
                            {editingId ? <PencilIcon className="mr-2 h-5 w-5 text-slate-500" /> : <PlusIcon className="mr-2 h-5 w-5 text-slate-500" />}
                            {editingId ? "Edit Item" : "Add Setup Item"}
                        </h3>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmitItem)} className="space-y-4">
                                <FormField control={form.control} name="name" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Item Name</FormLabel>
                                        <FormControl><Input placeholder="e.g. Surge Protector" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField control={form.control} name="category" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Category</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="priority" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Priority</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    {PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField control={form.control} name="cost" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Est. Cost ($)</FormLabel>
                                            <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="weight" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Weight (lbs)</FormLabel>
                                            <FormControl><Input type="number" step="0.1" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </div>
                                <FormField control={form.control} name="acquired" render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-slate-50">
                                        <div className="space-y-0.5">
                                            <FormLabel>Already Acquired?</FormLabel>
                                            <div className="text-xs text-muted-foreground">Mark true if you've already purchased this item.</div>
                                        </div>
                                        <FormControl>
                                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                                        </FormControl>
                                    </FormItem>
                                )} />
                                <div className="flex justify-end gap-2 pt-2">
                                    {editingId && (
                                        <Button type="button" variant="outline" onClick={() => { setEditingId(null); form.reset(); }}>
                                            Cancel
                                        </Button>
                                    )}
                                    <Button type="submit" className="bg-teal-600 hover:bg-teal-700">
                                        {editingId ? "Update Item" : "Add Item"}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </Card>

                    <Card className="p-6">
                        <h3 className="text-lg font-medium text-slate-800 mb-4">Cost By Category</h3>
                        {chartData.length > 0 ? (
                            <div className="h-64 flex items-center justify-center -ml-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={chartData}
                                            cx="50%" cy="50%" outerRadius={70} innerRadius={35} dataKey="value"
                                        >
                                            {chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                                        <Legend className="text-xs" />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-64 flex items-center justify-center text-slate-400 italic">
                                Add items to see chart
                            </div>
                        )}
                    </Card>

                </div>

                {/* Right Column - Shopping List */}
                <div className="space-y-6 lg:col-span-2">
                    <Card className="p-0 overflow-hidden h-full flex flex-col">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div>
                                <h3 className="text-lg font-medium text-slate-800">Shopping List & Inventory</h3>
                                <p className="text-sm text-slate-500">
                                    {summary.acquiredItems} of {summary.totalItems} items acquired
                                    ({Math.round((summary.acquiredItems / (summary.totalItems || 1)) * 100)}%)
                                </p>
                            </div>
                            <div className="w-64 h-2 bg-slate-200 rounded-full overflow-hidden hidden sm:block">
                                <div
                                    className="h-full bg-teal-500 transition-all duration-500"
                                    style={{ width: `${(summary.acquiredItems / (summary.totalItems || 1)) * 100}%` }}
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-auto max-h-[800px] p-0">
                            {items.length === 0 ? (
                                <div className="p-12 text-center text-slate-500 italic">No setup items added yet.</div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {items.sort((a, b) => Number(a.acquired) - Number(b.acquired)).map((item) => {
                                        const isEditing = editingId === item.id;
                                        return (
                                            <div
                                                key={item.id}
                                                className={`p-4 flex flex-col sm:flex-row gap-4 sm:items-center justify-between transition-all duration-200 ${isEditing
                                                        ? 'bg-purple-50 border-l-4 border-purple-500 shadow-sm rounded-r-md'
                                                        : item.acquired ? 'bg-slate-50/50 opacity-80' : 'hover:bg-slate-50'
                                                    }`}
                                            >

                                                <div className="flex items-start gap-3">
                                                    <button
                                                        onClick={() => toggleAcquired(item.id)}
                                                        className={`mt-1 rounded-full p-0.5 transition-colors ${item.acquired ? 'text-teal-500 hover:text-teal-600' : 'text-slate-300 hover:text-slate-400'}`}
                                                    >
                                                        {item.acquired ? <CheckCircle2Icon className="h-6 w-6" /> : <CircleIcon className="h-6 w-6" />}
                                                    </button>

                                                    <div>
                                                        <div className={`font-medium ${isEditing ? 'text-purple-900' : item.acquired ? 'text-slate-500 line-through decoration-slate-300' : 'text-slate-800'}`}>
                                                            {item.name} {isEditing && <span className="text-xs ml-2 bg-purple-200 text-purple-700 px-2 py-0.5 rounded-full no-underline">Editing</span>}
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                                                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-medium">
                                                                {item.category}
                                                            </span>
                                                            <span className={`px-2 py-0.5 rounded-full font-medium ${item.priority === 'Must Have' ? 'bg-red-50 text-red-600' :
                                                                item.priority === 'Nice to Have' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-600'
                                                                }`}>
                                                                {item.priority}
                                                            </span>
                                                            {item.weight ? <span className="text-slate-500">{item.weight} lbs</span> : null}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between sm:justify-end gap-6 ml-9 sm:ml-0">
                                                    <div className={`font-bold text-right min-w-[5rem] ${isEditing ? 'text-purple-700' : item.acquired ? 'text-slate-400' : 'text-slate-700'}`}>
                                                        {formatCurrency(item.cost)}
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <Button
                                                            variant={isEditing ? 'secondary' : 'ghost'}
                                                            size="icon"
                                                            className={`h-8 w-8 ${isEditing ? 'bg-purple-200 text-purple-700' : 'text-slate-400 hover:text-blue-600'}`}
                                                            onClick={() => editItem(item.id)}
                                                        >
                                                            <PencilIcon className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600" onClick={() => deleteItem(item.id)}>
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
        </div>
    );
}
