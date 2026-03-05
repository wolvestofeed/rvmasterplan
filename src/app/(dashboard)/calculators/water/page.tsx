"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    SaveIcon,
    ArrowLeft,
    DropletIcon,
    TrashIcon,
    PlusIcon,
    PencilIcon,
    ActivityIcon
} from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { toast } from "sonner";
import { HeaderHero } from "@/components/layout/header-hero";
import { formatNumber } from "@/lib/utils";
import { WaterData, WaterActivity, WaterSummary } from "@/types";
import { getWaterSystem, getWaterActivities, addWaterActivity, updateWaterActivity, deleteWaterActivity, getTankLogs, addTankLog } from "@/app/actions/water";
const waterActivitySchema = z.object({
    name: z.string().min(1, { message: "Activity name is required" }),
    category: z.string().min(1, { message: "Category is required" }),
    gallonsPerUse: z.coerce.number().min(0.01, { message: "Amount is required" }),
    timesPerDay: z.coerce.number().min(0.1, { message: "Times per day is required" }),
    isEssential: z.boolean().default(false),
    unitType: z.string().default("gallons")
});

type WaterActivityFormValues = z.infer<typeof waterActivitySchema>;

const COLORS = ['#3b82f6', '#14b8a6', '#10b981', '#f59e0b', '#8b5cf6', '#f43f5e'];

export default function WaterCalculatorPage() {
    const [isClient, setIsClient] = useState(false);
    const [activities, setActivities] = useState<WaterActivity[]>([]);
    const [waterData, setWaterData] = useState<WaterData>({
        freshWaterCapacity: 40, grayWaterCapacity: 30, blackWaterCapacity: 30,
        freshWaterLevel: 40, grayWaterLevel: 0, blackWaterLevel: 0, lastFillDate: ""
    });
    const [editingId, setEditingId] = useState<string | null>(null);

    // Tank Logging State
    const [isLogModalOpen, setIsLogModalOpen] = useState(false);
    const [logDate, setLogDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [logType, setLogType] = useState<'Dump' | 'Fill'>('Dump');
    const [logTank, setLogTank] = useState<'Fresh' | 'Gray' | 'Black'>('Gray');
    const [logVolume, setLogVolume] = useState<number>(0);
    const [tankLogs, setTankLogs] = useState<{ id: string, date: string, type: 'Dump' | 'Fill', tank: 'Fresh' | 'Gray' | 'Black', volume: number }[]>([]);
    const [projectedLevels, setProjectedLevels] = useState({ fresh: 40, gray: 0, black: 0 });

    const [summary, setSummary] = useState<WaterSummary>({
        dailyUsage: 0,
        daysUntilEmpty: 0,
        weeklyUsage: 0,
        monthlyUsage: 0,
        percentWaterRemaining: 0
    });

    const loadData = async () => {
        const [sys, acts, logs] = await Promise.all([
            getWaterSystem(),
            getWaterActivities(),
            getTankLogs()
        ]);

        if (sys.success && sys.data) {
            setWaterData(sys.data as WaterData);
        }
        if (acts.success && acts.data) {
            setActivities(acts.data.map((a: { gallonsPerUse: any; timesPerDay: any }) => ({
                ...a, gallonsPerUse: Number(a.gallonsPerUse) || 0, timesPerDay: Number(a.timesPerDay) || 0
            })) as WaterActivity[]);
        }
        if (logs.success && logs.data) {
            setTankLogs(logs.data.map((l: { volume: any }) => ({
                ...l, volume: Number(l.volume) || 0
            })) as any[]);
        }
    };

    useEffect(() => {
        setIsClient(true);
        loadData();
    }, []);

    const calculateUsages = () => {
        let fresh = 0;
        let gray = 0;
        let black = 0;
        activities.forEach(act => {
            const daily = act.gallonsPerUse * act.timesPerDay;
            fresh += daily;
            if (act.name.toLowerCase().includes('toilet') || act.name.toLowerCase().includes('flush')) {
                black += daily;
            } else {
                gray += daily;
            }
        });
        return { fresh, gray, black };
    };

    useEffect(() => {
        const usages = calculateUsages();
        const dailyUsage = usages.fresh;
        const capacity = waterData.freshWaterCapacity || 1;

        const daysUntilEmpty = dailyUsage > 0 ? (projectedLevels.fresh / dailyUsage) : 999;
        const weeklyUsage = dailyUsage * 7;
        const monthlyUsage = dailyUsage * 30;

        setSummary({
            dailyUsage,
            daysUntilEmpty: Number.isFinite(daysUntilEmpty) ? Math.floor(daysUntilEmpty) : 0,
            weeklyUsage,
            monthlyUsage,
            percentWaterRemaining: Math.round((projectedLevels.fresh / capacity) * 100)
        });
    }, [activities, projectedLevels, waterData]);

    useEffect(() => {
        const usages = calculateUsages();
        const freshCap = waterData.freshWaterCapacity;
        const grayCap = waterData.grayWaterCapacity;
        const blackCap = waterData.blackWaterCapacity;

        let fresh = freshCap;
        let gray = 0;
        let black = 0;

        const sortedLogs = [...tankLogs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // Start simulation 3 days ago if no logs, so the tanks show some partial usage for demonstration
        let startDateStr;
        if (sortedLogs.length > 0) {
            startDateStr = sortedLogs[0].date;
        } else {
            const threeDaysAgo = new Date();
            threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
            startDateStr = threeDaysAgo.toISOString().split('T')[0];
        }

        const startDate = new Date(startDateStr + "T00:00:00");
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const currentDate = new Date(startDate);
        let logIndex = 0;

        while (currentDate <= today) {
            const dateStr = currentDate.toISOString().split('T')[0];

            while (logIndex < sortedLogs.length && sortedLogs[logIndex].date === dateStr) {
                const log = sortedLogs[logIndex];
                if (log.tank === 'Fresh') {
                    if (log.type === 'Fill') fresh = Math.min(freshCap, fresh + log.volume);
                    if (log.type === 'Dump') fresh = Math.max(0, fresh - log.volume);
                } else if (log.tank === 'Gray') {
                    if (log.type === 'Fill') gray = Math.min(grayCap, gray + log.volume);
                    if (log.type === 'Dump') gray = Math.max(0, gray - log.volume);
                } else if (log.tank === 'Black') {
                    if (log.type === 'Fill') black = Math.min(blackCap, black + log.volume);
                    if (log.type === 'Dump') black = Math.max(0, black - log.volume);
                }
                logIndex++;
            }

            fresh = Math.max(0, fresh - usages.fresh);
            gray = Math.min(grayCap, gray + usages.gray);
            black = Math.min(blackCap, black + usages.black);

            currentDate.setDate(currentDate.getDate() + 1);
        }

        setProjectedLevels({ fresh, gray, black });

    }, [tankLogs, activities, waterData]);

    const form = useForm<WaterActivityFormValues>({
        resolver: zodResolver(waterActivitySchema) as any,
        defaultValues: {
            name: "",
            category: "Bathroom",
            gallonsPerUse: 1,
            timesPerDay: 1,
            isEssential: true,
            unitType: "gallons"
        }
    });

    const onSubmitActivity = async (data: WaterActivityFormValues) => {
        const activityData = {
            ...data,
            unitType: data.unitType as 'gallons' | 'ounces'
        };

        const loadingId = toast.loading(editingId ? "Updating activity..." : "Adding activity...");
        let result;
        if (editingId) {
            result = await updateWaterActivity(editingId, activityData);
        } else {
            result = await addWaterActivity(activityData);
        }

        if (result.success) {
            toast.success(editingId ? "Activity updated" : "Activity added", { id: loadingId });
            await loadData();
            setEditingId(null);
            form.reset();
        } else {
            toast.error(result.error || "Failed to save activity", { id: loadingId });
        }
    };

    const editActivity = (id: string) => {
        const act = activities.find(a => a.id === id);
        if (act) {
            setEditingId(id);
            form.reset({
                name: act.name,
                category: act.category,
                gallonsPerUse: act.gallonsPerUse,
                timesPerDay: act.timesPerDay,
                isEssential: act.isEssential,
                unitType: act.unitType
            });
            window.scrollTo({ top: 200, behavior: 'smooth' });
        }
    };

    const deleteActivity = async (id: string) => {
        const loadingId = toast.loading("Removing activity...");
        const result = await deleteWaterActivity(id);
        if (result.success) {
            toast.success("Activity removed", { id: loadingId });
            await loadData();
        } else {
            toast.error(result.error || "Failed to remove activity", { id: loadingId });
        }
    };

    const saveOverallData = () => {
        toast.info("Tank capacities can be managed in your RV Profile settings.");
    };

    const handleLogTank = async (e: React.FormEvent) => {
        e.preventDefault();

        const loadingId = toast.loading("Saving tank log...");
        const result = await addTankLog({
            date: logDate,
            type: logType,
            tank: logTank,
            volume: logVolume
        });

        if (result.success) {
            toast.success(`Logged ${logType}: ${logVolume} gal from ${logTank} Tank`, { id: loadingId });
            await loadData();
            setIsLogModalOpen(false);
            setLogVolume(0);
        } else {
            toast.error(result.error || "Failed to save tank log", { id: loadingId });
        }
    };

    // Pie chart data by category
    const usageByCategory = activities.reduce((acc, curr) => {
        const daily = curr.gallonsPerUse * curr.timesPerDay;
        acc[curr.category] = (acc[curr.category] || 0) + daily;
        return acc;
    }, {} as Record<string, number>);

    const chartData = Object.entries(usageByCategory).map(([name, value]) => ({ name, value }));

    if (!isClient) return null;

    return (
        <div className="container mx-auto py-10 px-4 md:px-8 max-w-6xl">
            <HeaderHero
                title="Water Usage Calculator"
                description="Track and optimize your RV water consumption with our interactive calculator."
                imageUrl="/images/page-headers/water-header.jpg"
            />

            {/* Dashboard Summary Cards */}
            <Card className="p-6 bg-slate-50 mb-6">
                <h3 className="text-lg font-medium text-slate-800 mb-4">Water Usage Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-white/90 via-white/40 to-[#2a4f3f]/30 p-4 rounded-lg border-2 border-[#2a4f3f]/20 shadow-[4px_4px_12px_rgba(0,0,0,0.15)] text-center relative overflow-hidden">
                        <div className="text-sm text-slate-500 font-medium mb-1 relative z-10">Daily Usage</div>
                        <div className="font-bold text-3xl text-[#2a4f3f] relative z-10">{formatNumber(summary.dailyUsage, 1)} gal</div>
                    </div>
                    <div className="bg-gradient-to-br from-white/90 via-white/40 to-[#8ca163]/40 p-4 rounded-lg border-2 border-[#8ca163]/20 shadow-[4px_4px_12px_rgba(0,0,0,0.15)] text-center relative overflow-hidden">
                        <div className="text-sm text-slate-500 font-medium mb-1 relative z-10">Days Until Empty</div>
                        <div className="font-bold text-3xl text-[#2a4f3f] relative z-10">{summary.daysUntilEmpty}</div>
                    </div>
                    <div className="bg-gradient-to-br from-white/90 via-white/40 to-[#2a4f3f]/30 p-4 rounded-lg border-2 border-[#2a4f3f]/20 shadow-[4px_4px_12px_rgba(0,0,0,0.15)] text-center relative overflow-hidden">
                        <div className="text-sm text-slate-500 font-medium mb-1 relative z-10">Weekly Usage</div>
                        <div className="font-bold text-3xl text-[#2a4f3f] relative z-10">{formatNumber(summary.weeklyUsage, 1)} gal</div>
                    </div>
                    <div className="bg-gradient-to-br from-white/90 via-white/40 to-[#8ca163]/40 p-4 rounded-lg border-2 border-[#8ca163]/20 shadow-[4px_4px_12px_rgba(0,0,0,0.15)] text-center relative overflow-hidden">
                        <div className="text-sm text-slate-500 font-medium mb-1 relative z-10">Current Tank Level</div>
                        <div className="font-bold text-3xl text-[#2a4f3f] relative z-10">{summary.percentWaterRemaining}%</div>
                    </div>
                </div>
            </Card>

            <div className="grid md:grid-cols-3 gap-6">

                {/* Left Column - Activities & Form */}
                <div className="space-y-6 md:col-span-2">

                    <Card className="p-6">
                        <h3 className="text-lg font-medium text-slate-800 mb-4 flex items-center">
                            <ActivityIcon className="mr-2 h-5 w-5 text-slate-500" />
                            {editingId ? "Edit Water Activity" : "Add Water Activity"}
                        </h3>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmitActivity)} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField control={form.control} name="name" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Activity Name</FormLabel>
                                            <FormControl><Input placeholder="e.g. Quick Shower" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="category" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Category</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Kitchen">Kitchen</SelectItem>
                                                    <SelectItem value="Bathroom">Bathroom</SelectItem>
                                                    <SelectItem value="Drinking">Drinking</SelectItem>
                                                    <SelectItem value="Cleaning">Cleaning</SelectItem>
                                                    <SelectItem value="Outdoor">Outdoor</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="gallonsPerUse" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Gallons Per Use</FormLabel>
                                            <FormControl><Input type="number" step="0.1" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="timesPerDay" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Uses Per Day</FormLabel>
                                            <FormControl><Input type="number" step="1" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </div>
                                <div className="flex justify-end gap-2 pt-2">
                                    {editingId && (
                                        <Button type="button" variant="outline" onClick={() => { setEditingId(null); form.reset(); }}>
                                            Cancel
                                        </Button>
                                    )}
                                    <Button type="submit">
                                        {editingId ? "Update Activity" : <><PlusIcon className="mr-2 h-4 w-4" /> Add Activity</>}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </Card>

                    <Card className="p-0 overflow-hidden">
                        <div className="p-6 border-b border-slate-100">
                            <h3 className="text-lg font-medium text-slate-800">Your Water Activities</h3>
                        </div>
                        {activities.length === 0 ? (
                            <div className="p-8 text-center text-slate-500 italic">No water activities added yet.</div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {activities.map((act) => {
                                    const isEditing = editingId === act.id;
                                    return (
                                        <div
                                            key={act.id}
                                            className={`p-4 flex items-center justify-between transition-all duration-200 ${isEditing
                                                ? 'bg-purple-50 border-l-4 border-purple-500 rounded-r-md'
                                                : 'hover:bg-slate-50'
                                                }`}
                                        >
                                            <div>
                                                <div className={`font-medium ${isEditing ? 'text-purple-900' : 'text-slate-800'}`}>
                                                    {act.name} {isEditing && <span className="text-xs ml-2 bg-purple-200 text-purple-700 px-2 py-0.5 rounded-full">Editing</span>}
                                                </div>
                                                <div className="text-sm text-slate-500">
                                                    {act.category} • {act.gallonsPerUse} gal/use • {act.timesPerDay}x/day
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className={`font-bold text-right min-w-[3rem] ${isEditing ? 'text-purple-700' : 'text-cyan-700'}`}>
                                                    {formatNumber(act.gallonsPerUse * act.timesPerDay, 1)} <span className="text-xs font-normal">g/d</span>
                                                </div>
                                                <div className="flex gap-1">
                                                    <Button
                                                        variant={isEditing ? 'secondary' : 'ghost'}
                                                        size="icon"
                                                        className={`h-8 w-8 ${isEditing ? 'bg-purple-200 text-purple-700' : 'text-slate-400 hover:text-blue-600'}`}
                                                        onClick={() => editActivity(act.id)}
                                                    >
                                                        <PencilIcon className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600" onClick={() => deleteActivity(act.id)}>
                                                        <TrashIcon className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </Card>

                </div>

                {/* Right Column - Tanks and Chart */}
                <div className="space-y-6">
                    <Card className="p-6">
                        <h3 className="text-lg font-medium text-slate-800 mb-4">Tank Status</h3>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium text-slate-700">Fresh Water</span>
                                    <span className="text-slate-500">{formatNumber(projectedLevels.fresh, 1)} / {waterData.freshWaterCapacity} gal</span>
                                </div>
                                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-3 bg-cyan-500 rounded-full transition-all duration-500" style={{ width: `${(projectedLevels.fresh / waterData.freshWaterCapacity) * 100}%` }} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium text-slate-700">Gray Water</span>
                                    <span className="text-slate-500">{formatNumber(projectedLevels.gray, 1)} / {waterData.grayWaterCapacity} gal</span>
                                </div>
                                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-3 bg-slate-400 rounded-full transition-all duration-500" style={{ width: `${(projectedLevels.gray / waterData.grayWaterCapacity) * 100}%` }} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium text-slate-700">Black Water</span>
                                    <span className="text-slate-500">{formatNumber(projectedLevels.black, 1)} / {waterData.blackWaterCapacity} gal</span>
                                </div>
                                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-3 bg-slate-800 rounded-full transition-all duration-500" style={{ width: `${(projectedLevels.black / waterData.blackWaterCapacity) * 100}%` }} />
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 pt-4 border-t">
                            <Dialog open={isLogModalOpen} onOpenChange={setIsLogModalOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" className="w-full text-cyan-700 hover:text-cyan-800 border-cyan-200">
                                        <DropletIcon className="mr-2 h-4 w-4" /> Log Tank Dump / Fill
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[425px]">
                                    <DialogHeader>
                                        <DialogTitle>Log Tank Activity</DialogTitle>
                                        <DialogDescription>
                                            Record a new dump or fill. This will update your current estimated tank levels.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <form onSubmit={handleLogTank} className="space-y-4 py-4">
                                        <div className="space-y-1">
                                            <Label>Date</Label>
                                            <Input type="date" value={logDate} onChange={e => setLogDate(e.target.value)} required />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <Label>Action</Label>
                                                <Select value={logType} onValueChange={(val: 'Dump' | 'Fill') => setLogType(val)}>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Dump">Dump</SelectItem>
                                                        <SelectItem value="Fill">Fill</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-1">
                                                <Label>Tank</Label>
                                                <Select value={logTank} onValueChange={(val: 'Fresh' | 'Gray' | 'Black') => setLogTank(val)}>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Fresh">Fresh Water</SelectItem>
                                                        <SelectItem value="Gray">Gray Water</SelectItem>
                                                        <SelectItem value="Black">Black Water</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <Label>Volume (Gallons)</Label>
                                            <Input type="number" step="1" value={logVolume || ''} onChange={e => setLogVolume(Number(e.target.value))} required />
                                        </div>
                                        <div className="flex justify-end pt-4">
                                            <Button type="button" variant="ghost" className="mr-2" onClick={() => setIsLogModalOpen(false)}>Cancel</Button>
                                            <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700">Save Activity</Button>
                                        </div>
                                    </form>
                                </DialogContent>
                            </Dialog>

                            {/* Recent Logs List */}
                            {tankLogs.length > 0 && (
                                <div className="mt-4 space-y-2">
                                    <h4 className="text-sm font-medium text-slate-700">Recent Logs</h4>
                                    <div className="max-h-32 overflow-y-auto space-y-2 pr-1">
                                        {tankLogs.map(log => (
                                            <div key={log.id} className="text-xs flex justify-between items-center p-2 bg-slate-50 border rounded-md">
                                                <div>
                                                    <span className="font-medium">{log.date}</span>
                                                    <span className="text-slate-500 ml-2">{log.type} {log.tank}</span>
                                                </div>
                                                <div className="font-medium text-slate-700">{log.volume} gal</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>

                    <Card className="p-6">
                        <h3 className="text-lg font-medium text-slate-800 mb-4">Usage By Category</h3>
                        {chartData.length > 0 ? (
                            <div className="h-64 flex items-center justify-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={chartData}
                                            cx="50%" cy="50%" outerRadius={80} innerRadius={40} dataKey="value"
                                        >
                                            {chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value: any) => `${formatNumber(Number(value), 1)} gal`} />
                                        <Legend verticalAlign="bottom" />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-64 flex items-center justify-center text-slate-400 italic">
                                Add activities to see chart
                            </div>
                        )}
                    </Card>

                </div>
            </div>
        </div>
    );
}
