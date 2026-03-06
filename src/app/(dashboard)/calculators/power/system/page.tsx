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
    ActivityIcon,
    ZapIcon,
    SunIcon,
    BatteryChargingIcon,
    DownloadIcon,
    ImportIcon,
    CalendarIcon,
    CloudIcon
} from "lucide-react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { toast } from "sonner";
import { HeaderHero } from "@/components/layout/header-hero";
import { formatNumber } from "@/lib/utils";
import { getSystemSettings } from "@/app/actions/admin";

import {
    ElectricalDevice,
    EnergyData,
    SolarPanel,
    SolarBattery,
    SolarGenerator,
    SolarInverter,
    GenericSolarEquipment,
    GenericSolarEquipmentType,
    DailySolarLog,
    WeatherCondition,
    DeviceCategory,
    DeviceGroup,
    SetupItem
} from "@/types";

import {
    getElectricalDevices, addElectricalDevice, updateElectricalDevice, deleteElectricalDevice,
    getSolarEquipment, addSolarEquipment, updateSolarEquipment, deleteSolarEquipment,
    getDailySolarLogs, addDailySolarLog, updateDailySolarLog, deleteDailySolarLog
} from "@/app/actions/power";
import { getEquipmentItems } from "@/app/actions/equipment";

const COLORS = ['#3b82f6', '#14b8a6', '#10b981', '#f59e0b', '#8b5cf6', '#f43f5e', '#ef4444', '#64748b'];

const deviceSchema = z.object({
    name: z.string().min(1, { message: "Name is required" }),
    group: z.enum(['Essential', 'Non-essential'] as const),
    category: z.string().min(1),
    watts: z.coerce.number().min(0),
    hoursPerDay: z.coerce.number().min(0),
});
type DeviceFormValues = z.infer<typeof deviceSchema>;

const equipmentSchema = z.object({
    make: z.string().min(1, { message: "Make is required" }),
    model: z.string().min(1, { message: "Model is required" }),
    equipmentType: z.enum(['Generator', 'Battery', 'Solar Panel', 'Inverter', 'Charge Controller', 'Battery Monitor', 'DC Alternator Charger', 'Surge Protector', 'Other'] as const),
    quantity: z.coerce.number().min(1),
    price: z.coerce.number().min(0),
    specs: z.string().optional(),
    wattage: z.coerce.number().min(0).optional(),
    weight: z.coerce.number().min(0).optional()
});
type EquipmentFormValues = z.infer<typeof equipmentSchema>;

const solarLogSchema = z.object({
    date: z.string().min(1, { message: "Date is required" }),
    weatherCondition: z.enum(['Sunny', 'Partly Cloudy', 'Cloudy', 'Overcast', 'Bad Weather'] as const),
    sunHours: z.coerce.number().min(0),
    generatedWh: z.coerce.number().min(0)
});
type SolarLogFormValues = z.infer<typeof solarLogSchema>;

export default function PowerStrategyPage() {
    const [isClient, setIsClient] = useState(false);
    const [devices, setDevices] = useState<ElectricalDevice[]>([]);
    const [energyData, setEnergyData] = useState<EnergyData>({
        sunHours: 5, avgWattsPerHour: 200, useLogAvgWatts: true, batteryCapacity: 10800, batteryVoltage: 12, solarArray: 800
    });
    const [panels, setPanels] = useState<SolarPanel[]>([]);
    const [batteries, setBatteries] = useState<SolarBattery[]>([]);
    const [generators, setGenerators] = useState<SolarGenerator[]>([]);
    const [inverters, setInverters] = useState<SolarInverter[]>([]);
    const [genericEquipment, setGenericEquipment] = useState<GenericSolarEquipment[]>([]);
    const [solarLogs, setSolarLogs] = useState<DailySolarLog[]>([]);
    const [budgetItems, setBudgetItems] = useState<SetupItem[]>([]);
    const [editingDeviceId, setEditingDeviceId] = useState<string | null>(null);
    const [editingEquipmentId, setEditingEquipmentId] = useState<string | null>(null);
    const [editingLogId, setEditingLogId] = useState<string | null>(null);
    const [equipmentModalOpen, setEquipmentModalOpen] = useState(false);
    const [logFilterMonth, setLogFilterMonth] = useState<string>('all');
    const [estimatedDeviceWeight, setEstimatedDeviceWeight] = useState<number>(20);
    const [featureSolarCapture, setFeatureSolarCapture] = useState(true);

    const loadData = async () => {
        const [
            { success: setsSuccess, data: setsData },
            { success: devSuccess, data: devData },
            { success: eqSuccess, data: eqData },
            { success: logSuccess, data: logData },
            { success: budgetSuccess, data: budgetData }
        ] = await Promise.all([
            getSystemSettings(),
            getElectricalDevices(),
            getSolarEquipment(),
            getDailySolarLogs(),
            getEquipmentItems()
        ]);

        if (setsSuccess && setsData?.featureFlags) {
            const flags = setsData.featureFlags as Record<string, boolean>;
            setFeatureSolarCapture(flags["solar_capture"] ?? true);
        }

        if (devSuccess && devData) {
            setDevices(devData.map((d: any) => ({
                ...d, group: d.groupType, watts: Number(d.watts) || 0, hoursPerDay: Number(d.hoursPerDay) || 0
            })) as ElectricalDevice[]);
        }

        if (eqSuccess && eqData) {
            const parsedEq = eqData.map((e: any) => ({
                ...e, price: Number(e.price) || 0, wattage: Number(e.wattage) || 0, weight: Number(e.weight) || 0
            }));
            setGenericEquipment(parsedEq as GenericSolarEquipment[]);
            setPanels(parsedEq.filter((e: any) => e.equipmentType === 'Solar Panel') as any);
            setBatteries(parsedEq.filter((e: any) => e.equipmentType === 'Battery') as any);
            setGenerators(parsedEq.filter((e: any) => e.equipmentType === 'Generator') as any);
            setInverters(parsedEq.filter((e: any) => e.equipmentType === 'Inverter') as any);
        }

        if (logSuccess && logData) {
            setSolarLogs(logData.map((l: any) => ({
                ...l, sunHours: Number(l.sunHours) || 0, generatedWh: Number(l.generatedWh) || 0
            })) as DailySolarLog[]);
        }

        if (budgetSuccess && budgetData) {
            setBudgetItems(budgetData.map((b: any) => ({
                ...b, acquired: b.isAcquired
            })) as SetupItem[]);
        }
    };

    useEffect(() => {
        setIsClient(true);
        loadData();
    }, []);

    const deviceForm = useForm<DeviceFormValues>({
        resolver: zodResolver(deviceSchema) as any,
        defaultValues: {
            name: "", group: "Essential", category: "Refrigeration", watts: 0, hoursPerDay: 0
        }
    });

    const equipmentForm = useForm<EquipmentFormValues>({
        resolver: zodResolver(equipmentSchema) as any,
        defaultValues: {
            make: "", model: "", equipmentType: "Generator", quantity: 1, price: 0, specs: "", wattage: 0
        }
    });

    const solarLogForm = useForm<SolarLogFormValues>({
        resolver: zodResolver(solarLogSchema) as any,
        defaultValues: {
            date: new Date().toISOString().split('T')[0],
            weatherCondition: 'Sunny',
            sunHours: 0,
            generatedWh: 0
        }
    });

    const watchedEquipmentType = equipmentForm.watch('equipmentType');

    const getTotalDailyConsumption = () => {
        return devices.reduce((sum, d) => sum + (d.watts * d.hoursPerDay), 0);
    };

    const getTotalPanelWattage = () => {
        return panels.reduce((sum, p) => sum + (p.wattage * p.quantity), 0);
    };

    const getDailySolarGeneration = () => {
        if (solarLogs.length === 0) {
            // Fallback to static estimate if no logs exist
            const totalWatts = getTotalPanelWattage();
            const efficiencyFactor = 0.85;
            return Math.round(totalWatts * energyData.sunHours * efficiencyFactor);
        }
        const totalWh = solarLogs.reduce((sum, log) => sum + log.generatedWh, 0);
        return Math.round(totalWh / solarLogs.length);
    };

    const getTotalBatteryCapacity = () => {
        const standalone = batteries.reduce((sum, b) => sum + (b.capacityWh * b.quantity), 0);
        const genBats = generators.reduce((sum, g) => sum + (g.batteryCapacityWh * g.quantity), 0);
        return standalone + genBats;
    };

    const getBatteryRuntime = () => {
        const consumption = getTotalDailyConsumption();
        if (consumption === 0) return '∞';
        return (getTotalBatteryCapacity() / (consumption / 24)).toFixed(1);
    };

    const getTotalSolarSystemWeight = () => {
        return genericEquipment.reduce((total, item) => total + ((item.weight || 0) * item.quantity), 0);
    };

    const onDeviceSubmit = async (data: DeviceFormValues) => {
        const loadingId = toast.loading(editingDeviceId ? "Updating device..." : "Adding device...");
        const result = editingDeviceId
            ? await updateElectricalDevice(editingDeviceId, data)
            : await addElectricalDevice(data);

        if (result.success) {
            toast.success(editingDeviceId ? "Device updated!" : "Device added!", { id: loadingId });
            await loadData();
            setEditingDeviceId(null);
            deviceForm.reset({ name: "", group: "Essential", category: "Refrigeration", watts: 0, hoursPerDay: 0 });
        } else {
            toast.error(result.error || "Failed to save device", { id: loadingId });
        }
    };

    const onEquipmentSubmit = async (data: EquipmentFormValues) => {
        const loadingId = toast.loading(editingEquipmentId ? "Updating equipment..." : "Adding equipment...");
        const result = editingEquipmentId
            ? await updateSolarEquipment(editingEquipmentId, data)
            : await addSolarEquipment(data);

        if (result.success) {
            toast.success(editingEquipmentId ? "Equipment updated!" : "Equipment added!", { id: loadingId });
            await loadData();
            setEditingEquipmentId(null);
            setEquipmentModalOpen(false);
            equipmentForm.reset();
        } else {
            toast.error(result.error || "Failed to save equipment", { id: loadingId });
        }
    };

    const editGenericEquipment = (id: string) => {
        const item = genericEquipment.find(e => e.id === id);
        if (item) {
            setEditingEquipmentId(id);
            equipmentForm.reset({
                make: item.make,
                model: item.model,
                equipmentType: item.equipmentType,
                quantity: item.quantity,
                price: item.price,
                specs: item.specs || '',
                wattage: item.wattage || 0,
                weight: item.weight || 0
            });
            setEquipmentModalOpen(true);
        }
    };

    const deleteGenericEquipment = async (id: string) => {
        const loadingId = toast.loading("Removing equipment...");
        const result = await deleteSolarEquipment(id);
        if (result.success) {
            toast.success("Equipment removed", { id: loadingId });
            await loadData();
        } else {
            toast.error(result.error || "Failed to remove equipment", { id: loadingId });
        }
    };

    const onSolarLogSubmit = (data: SolarLogFormValues) => {
        if (editingLogId) {
            setSolarLogs(solarLogs.map(l => l.id === editingLogId ? { ...l, ...data } : l));
            setEditingLogId(null);
            toast.success("Log entry updated!");
        } else {
            setSolarLogs([...solarLogs, { ...data, id: Date.now().toString() }]);
            toast.success("Solar capture logged!");
        }
        solarLogForm.reset({
            date: new Date().toISOString().split('T')[0],
            weatherCondition: 'Sunny',
            sunHours: 0,
            generatedWh: 0
        });
    };

    const deleteSolarLog = (id: string) => {
        setSolarLogs(solarLogs.filter(l => l.id !== id));
        toast.success("Log entry removed");
    };

    const editSolarLog = (id: string) => {
        const log = solarLogs.find(l => l.id === id);
        if (log) {
            setEditingLogId(id);
            solarLogForm.reset({
                date: log.date,
                weatherCondition: log.weatherCondition,
                sunHours: log.sunHours,
                generatedWh: log.generatedWh
            });
        }
    };

    const getFilteredLogs = () => {
        if (logFilterMonth === 'all') return solarLogs;
        return solarLogs.filter(log => log.date.substring(0, 7) === logFilterMonth);
    };

    const getAvailableMonths = () => {
        const months = new Set(solarLogs.map(log => log.date.substring(0, 7)));
        return Array.from(months).sort().reverse();
    };

    const getWeatherEmoji = (condition: WeatherCondition) => {
        switch (condition) {
            case 'Sunny': return '☀️';
            case 'Partly Cloudy': return '⛅';
            case 'Cloudy': return '☁️';
            case 'Overcast': return '🌫️';
            case 'Bad Weather': return '⛈️';
        }
    };

    const editDevice = (id: string) => {
        const dev = devices.find(d => d.id === id);
        if (dev) {
            setEditingDeviceId(id);
            deviceForm.reset({ name: dev.name, group: dev.group, category: dev.category, watts: dev.watts, hoursPerDay: dev.hoursPerDay });
            window.scrollTo({ top: 200, behavior: 'smooth' });
        }
    };

    const deleteDevice = (id: string) => {
        setDevices(devices.filter(d => d.id !== id));
        toast.success("Device removed");
    };

    const importFromSetupBudget = async () => {
        const energyItems = budgetItems.filter((item: SetupItem) => item.category === 'ENERGY' && (item as any).isAcquired);

        if (energyItems.length === 0) {
            toast.error("No acquired energy items found in Setup Budget.");
            return;
        }

        const loadingId = toast.loading("Importing...");
        let added = 0;

        for (const item of energyItems) {
            const name = item.name.toLowerCase();
            let eqType = "Other";
            let wattage = 100;

            if (name.includes('panel')) {
                eqType = "Solar Panel";
                const match = name.match(/(\d+)\s*w/i);
                if (match && match[1]) wattage = parseInt(match[1], 10);
            } else if (name.includes('generator') || name.includes('ecoflow')) {
                eqType = "Generator";
                wattage = 3600;
            } else if (name.includes('battery')) {
                eqType = "Battery";
                wattage = 1000;
            }

            await addSolarEquipment({
                make: "Imported",
                model: item.name,
                equipmentType: eqType,
                quantity: 1,
                price: Number(item.cost) || 0,
                specs: "Imported from Setup Budget",
                wattage: wattage,
                weight: Number(item.weight) || 0
            });
            added++;
        }

        await loadData();
        toast.success(`Imported ${added} energy items from Setup Budget!`, { id: loadingId });
    };

    const saveOverallData = () => {
        toast.success("Power strategy saved temporarily for demo mode!");
    };

    // Pie chart data by category 
    const consumptionByCategory = devices.reduce((acc, curr) => {
        const daily = curr.watts * curr.hoursPerDay;
        acc[curr.category] = (acc[curr.category] || 0) + daily;
        return acc;
    }, {} as Record<string, number>);

    const chartData = Object.entries(consumptionByCategory)
        .map(([name, value]) => ({ name, value }))
        .filter(d => d.value > 0);

    if (!isClient) return null;

    return (
        <div className="container mx-auto py-10 px-4 md:px-8 max-w-6xl">
            <HeaderHero
                title="Power Strategy and Solar Energy"
                description="Calculate your electrical load, size your solar array, and estimate your battery runtime."
                imageUrl="/images/page-headers/power_solar-header.jpg"
            />

            <div className="flex justify-end mt-2 mb-8 gap-2">
                <Button variant="outline" onClick={importFromSetupBudget} className="flex items-center">
                    <ImportIcon className="mr-2 h-4 w-4" /> Import from Budget
                </Button>
                <Button onClick={saveOverallData} className="flex items-center bg-amber-600 hover:bg-amber-700 text-white">
                    <SaveIcon className="mr-2 h-4 w-4" /> Save Strategy
                </Button>
            </div>

            {/* Hero Analytics Dash */}
            <Card className="p-6 bg-slate-50 mb-8">
                <h3 className="text-lg font-medium text-slate-800 mb-4">Energy Balance</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-white/90 via-white/40 to-[#2a4f3f]/30 p-4 rounded-lg border-2 border-[#2a4f3f]/20 shadow-[4px_4px_12px_rgba(0,0,0,0.15)] text-center relative overflow-hidden">
                        <div className="text-sm text-slate-500 font-medium mb-1 relative z-10">Daily Consumption</div>
                        <div className="font-bold text-3xl text-[#2a4f3f] relative z-10">{formatNumber(getTotalDailyConsumption())} <span className="text-sm font-normal">Wh</span></div>
                    </div>
                    <div className="bg-gradient-to-br from-white/90 via-white/40 to-[#8ca163]/40 p-4 rounded-lg border-2 border-[#8ca163]/20 shadow-[4px_4px_12px_rgba(0,0,0,0.15)] text-center relative overflow-hidden">
                        <div className="text-sm text-slate-500 font-medium mb-1 relative z-10">Avg Daily Solar Gen</div>
                        <div className="font-bold text-3xl text-[#2a4f3f] relative z-10">{formatNumber(getDailySolarGeneration())} <span className="text-sm font-normal">Wh</span></div>
                        <div className="text-xs text-slate-400 relative z-10">{solarLogs.length > 0 ? `Based on ${solarLogs.length} log${solarLogs.length > 1 ? 's' : ''}` : 'Static estimate'}</div>
                    </div>
                    <div className="bg-gradient-to-br from-white/90 via-white/40 to-[#2a4f3f]/30 p-4 rounded-lg border-2 border-[#2a4f3f]/20 shadow-[4px_4px_12px_rgba(0,0,0,0.15)] text-center relative overflow-hidden">
                        <div className="text-sm text-slate-500 font-medium mb-1 relative z-10">Battery Storage</div>
                        <div className="font-bold text-3xl text-[#2a4f3f] relative z-10">{formatNumber(getTotalBatteryCapacity())} <span className="text-sm font-normal">Wh</span></div>
                    </div>
                    <div className="bg-gradient-to-br from-white/90 via-white/40 to-[#8ca163]/40 p-4 rounded-lg border-2 border-[#8ca163]/20 shadow-[4px_4px_12px_rgba(0,0,0,0.15)] text-center relative overflow-hidden">
                        <div className="text-sm text-slate-500 font-medium mb-1 relative z-10">Est. Runtime no Sun</div>
                        <div className="font-bold text-3xl text-[#2a4f3f] relative z-10">{getBatteryRuntime()} <span className="text-sm font-normal">hrs</span></div>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="bg-gradient-to-br from-white/90 via-white/40 to-[#2a4f3f]/30 p-4 rounded-lg border-2 border-[#2a4f3f]/20 shadow-[4px_4px_12px_rgba(0,0,0,0.15)] text-center relative overflow-hidden">
                        <div className="text-sm text-slate-500 font-medium mb-1 relative z-10">Solar System Weight</div>
                        <div className="font-bold text-3xl text-[#2a4f3f] relative z-10">{formatNumber(getTotalSolarSystemWeight())} <span className="text-sm font-normal">lbs</span></div>
                    </div>
                    <div className="bg-gradient-to-br from-white/90 via-white/40 to-[#8ca163]/40 p-4 rounded-lg border-2 border-[#8ca163]/20 shadow-[4px_4px_12px_rgba(0,0,0,0.15)] text-center relative overflow-hidden">
                        <div className="text-sm text-slate-500 font-medium mb-1 relative z-10">Device Weight</div>
                        <div className="font-bold text-3xl text-[#2a4f3f] relative z-10">{formatNumber(estimatedDeviceWeight)} <span className="text-sm font-normal">lbs</span></div>
                    </div>
                </div>
                <div className="mt-6">
                    <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">Solar Coverage (Gen vs Consumption)</span>
                        <span>{Math.round((getDailySolarGeneration() / (getTotalDailyConsumption() || 1)) * 100)}%</span>
                    </div>
                    <Progress value={(getDailySolarGeneration() / (getTotalDailyConsumption() || 1)) * 100} className="h-3" />
                </div>
            </Card>

            <Tabs defaultValue="load">
                <TabsList className="mb-6 grid w-full max-w-lg" style={{ gridTemplateColumns: featureSolarCapture ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)' }}>
                    <TabsTrigger value="load">Electrical Load</TabsTrigger>
                    <TabsTrigger value="solar">Solar Equipment</TabsTrigger>
                    {featureSolarCapture && <TabsTrigger value="capture">Solar Capture</TabsTrigger>}
                </TabsList>

                <TabsContent value="load" className="space-y-6">
                    <div className="grid lg:grid-cols-3 gap-6">
                        <div className="space-y-6 lg:col-span-1">
                            <Card className="p-6">
                                <h3 className="text-lg font-medium text-slate-800 mb-4">
                                    {editingDeviceId ? "Edit Device" : "Add Device"}
                                </h3>
                                <Form {...deviceForm}>
                                    <form onSubmit={deviceForm.handleSubmit(onDeviceSubmit)} className="space-y-4">
                                        <FormField control={deviceForm.control} name="name" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Device Name</FormLabel>
                                                <FormControl><Input placeholder="e.g. Starlink" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField control={deviceForm.control} name="group" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Group</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="Essential">Essential</SelectItem>
                                                            <SelectItem value="Non-essential">Non-essential</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <FormField control={deviceForm.control} name="category" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Category</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                        <SelectContent>
                                                            {['Refrigeration', 'Plumbing', 'Lighting', 'IT/Comms', 'Climate Control', 'Kitchen', 'Personal Care', 'Recreation', 'Work'].map(c =>
                                                                <SelectItem key={c} value={c}>{c}</SelectItem>
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField control={deviceForm.control} name="watts" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Watts</FormLabel>
                                                    <FormControl><Input type="number" step="1" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <FormField control={deviceForm.control} name="hoursPerDay" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Hours / Day</FormLabel>
                                                    <FormControl><Input type="number" step="0.1" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        </div>
                                        <div className="flex justify-end gap-2 pt-2">
                                            {editingDeviceId && (
                                                <Button type="button" variant="outline" onClick={() => { setEditingDeviceId(null); deviceForm.reset(); }}>
                                                    Cancel
                                                </Button>
                                            )}
                                            <Button type="submit" className="bg-amber-600 hover:bg-amber-700">
                                                {editingDeviceId ? "Update Device" : "Add Device"}
                                            </Button>
                                        </div>
                                    </form>
                                </Form>
                            </Card>

                            <Card className="p-6">
                                <h3 className="text-lg font-medium text-slate-800 mb-4">Consumption By Category</h3>
                                {chartData.length > 0 ? (
                                    <div className="h-64 flex items-center justify-center -ml-4">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie data={chartData} cx="50%" cy="50%" outerRadius={70} innerRadius={35} dataKey="value">
                                                    {chartData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip formatter={(value: any) => `${formatNumber(Number(value))} Wh`} />
                                                <Legend className="text-xs" />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <div className="h-64 flex items-center justify-center text-slate-400 italic">No devices added</div>
                                )}
                            </Card>
                        </div>

                        <div className="space-y-6 lg:col-span-2">
                            <Card className="p-0 overflow-hidden h-full flex flex-col">
                                <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                                    <h3 className="text-lg font-medium text-slate-800">Device Inventory</h3>
                                    <div className="flex items-center gap-2">
                                        <label className="text-xs text-slate-500 whitespace-nowrap">Est. Device Weight</label>
                                        <Input type="number" className="w-24 h-8 text-sm" placeholder="lbs" value={estimatedDeviceWeight || ''} onChange={e => setEstimatedDeviceWeight(Number(e.target.value) || 0)} />
                                        <span className="text-xs text-slate-400">lbs</span>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-auto max-h-[800px] p-0">
                                    {devices.length === 0 ? (
                                        <div className="p-12 text-center text-slate-500 italic">No electrical devices added yet.</div>
                                    ) : (
                                        <div className="divide-y divide-slate-100">
                                            {devices.sort((a, b) => (b.watts * b.hoursPerDay) - (a.watts * a.hoursPerDay)).map((device) => {
                                                const isEditing = editingDeviceId === device.id;
                                                return (
                                                    <div
                                                        key={device.id}
                                                        className={`p-4 flex items-center justify-between transition-all duration-200 ${isEditing
                                                            ? 'bg-purple-50 border-l-4 border-purple-500 rounded-r-md'
                                                            : 'hover:bg-slate-50'
                                                            }`}
                                                    >
                                                        <div>
                                                            <div className={`font-medium ${isEditing ? 'text-purple-900' : 'text-slate-800'}`}>
                                                                {device.name} {isEditing && <span className="text-xs ml-2 bg-purple-200 text-purple-700 px-2 py-0.5 rounded-full">Editing</span>}
                                                            </div>
                                                            <div className="text-sm text-slate-500">
                                                                {device.group} • {device.category} • {device.watts}W × {device.hoursPerDay}h
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <div className={`font-bold text-right min-w-[3rem] ${isEditing ? 'text-purple-700' : 'text-cyan-700'}`}>
                                                                {formatNumber(device.watts * device.hoursPerDay)} <span className="text-xs font-normal">Wh/d</span>
                                                            </div>
                                                            <div className="flex gap-1">
                                                                <Button
                                                                    variant={isEditing ? 'secondary' : 'ghost'}
                                                                    size="icon"
                                                                    className={`h-8 w-8 ${isEditing ? 'bg-purple-200 text-purple-700' : 'text-slate-400 hover:text-blue-600'}`}
                                                                    onClick={() => editDevice(device.id)}
                                                                >
                                                                    <PencilIcon className="h-4 w-4" />
                                                                </Button>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600" onClick={() => deleteDevice(device.id)}>
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

                <TabsContent value="solar" className="space-y-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-slate-800">Solar & Power Equipment</h2>
                        <Dialog open={equipmentModalOpen} onOpenChange={setEquipmentModalOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-amber-600 hover:bg-amber-700 text-white">
                                    <PlusIcon className="mr-2 h-4 w-4" /> Add Equipment
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>{editingEquipmentId ? 'Edit Equipment' : 'Add Power Equipment'}</DialogTitle>
                                    <DialogDescription>
                                        {editingEquipmentId ? 'Update this equipment in your power strategy.' : 'Add a new piece of equipment to your power strategy.'}
                                    </DialogDescription>
                                </DialogHeader>
                                <Form {...equipmentForm}>
                                    <form onSubmit={equipmentForm.handleSubmit(onEquipmentSubmit)} className="space-y-4">
                                        <FormField control={equipmentForm.control} name="equipmentType" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Equipment Type</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        {['Generator', 'Battery', 'Solar Panel', 'Inverter', 'Charge Controller', 'Battery Monitor', 'DC Alternator Charger', 'Surge Protector', 'Other'].map(c =>
                                                            <SelectItem key={c} value={c}>{c}</SelectItem>
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField control={equipmentForm.control} name="make" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Make</FormLabel>
                                                    <FormControl><Input placeholder="e.g. Victron" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <FormField control={equipmentForm.control} name="model" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Model</FormLabel>
                                                    <FormControl><Input placeholder="e.g. SmartShunt" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        </div>
                                        <FormField control={equipmentForm.control} name="specs" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Key Specs / Notes (Optional)</FormLabel>
                                                <FormControl><Input placeholder="e.g. 500A/50mV" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        {(watchedEquipmentType === 'Solar Panel' || watchedEquipmentType === 'Generator' || watchedEquipmentType === 'Battery') && (
                                            <FormField control={equipmentForm.control} name="wattage" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Wattage (W)</FormLabel>
                                                    <FormControl><Input type="number" step="1" placeholder="e.g. 400" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        )}
                                        <FormField control={equipmentForm.control} name="weight" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Weight per unit (lbs)</FormLabel>
                                                <FormControl><Input type="number" step="0.1" placeholder="e.g. 12.5" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField control={equipmentForm.control} name="price" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Est. Price ($)</FormLabel>
                                                    <FormControl><Input type="number" step="1" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <FormField control={equipmentForm.control} name="quantity" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Quantity</FormLabel>
                                                    <FormControl><Input type="number" step="1" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        </div>
                                        <div className="flex justify-end pt-4 gap-2">
                                            {editingEquipmentId && (
                                                <Button type="button" variant="outline" className="w-1/3" onClick={() => { setEditingEquipmentId(null); equipmentForm.reset(); setEquipmentModalOpen(false); }}>Cancel</Button>
                                            )}
                                            <Button type="submit" className={`${editingEquipmentId ? 'w-2/3' : 'w-full'} bg-amber-600 hover:bg-amber-700`}>{editingEquipmentId ? 'Update' : 'Add Component'}</Button>
                                        </div>
                                    </form>
                                </Form>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <Card className="p-6">
                            <h3 className="text-lg font-medium text-slate-800 mb-4">
                                Solar Panels
                            </h3>
                            {genericEquipment.filter(item => item.equipmentType === 'Solar Panel').length === 0 ? <p className="text-sm text-slate-500">No solar panels configured.</p> : (
                                <div className="space-y-3">
                                    {genericEquipment.filter(item => item.equipmentType === 'Solar Panel').map(p => (
                                        <div key={p.id} className="flex flex-col p-3 bg-slate-50 rounded-lg border border-slate-100 group relative">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <div className="font-medium text-slate-800">{p.make} {p.model}</div>
                                                    <div className="text-xs text-slate-500">{p.specs ? `${p.specs} • ` : ''}Qty: {p.quantity}{p.weight ? ` • ${p.weight * p.quantity} lbs` : ''}</div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <div className="font-bold text-slate-700 mr-2">${formatNumber(p.price * p.quantity)}</div>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600" onClick={() => editGenericEquipment(p.id)}>
                                                        <PencilIcon className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600" onClick={() => deleteGenericEquipment(p.id)}>
                                                        <TrashIcon className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>

                        <Card className="p-6">
                            <h3 className="text-lg font-medium text-slate-800 mb-4">
                                Batteries & Generators
                            </h3>
                            {genericEquipment.filter(item => item.equipmentType === 'Battery' || item.equipmentType === 'Generator').length === 0 ? <p className="text-sm text-slate-500">No storage configured.</p> : (
                                <div className="space-y-3">
                                    {genericEquipment.filter(item => item.equipmentType === 'Generator').map(g => (
                                        <div key={g.id} className="flex flex-col p-3 bg-slate-50 rounded-lg border border-slate-100 group relative">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <div className="font-medium text-slate-800">{g.make} {g.model}</div>
                                                    <div className="text-xs text-slate-500">Generator {g.specs ? `• ${g.specs}` : ''} • Qty: {g.quantity}{g.weight ? ` • ${g.weight * g.quantity} lbs` : ''}</div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <div className="font-bold text-slate-700 mr-2">${formatNumber(g.price * g.quantity)}</div>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600" onClick={() => editGenericEquipment(g.id)}>
                                                        <PencilIcon className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600" onClick={() => deleteGenericEquipment(g.id)}>
                                                        <TrashIcon className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {genericEquipment.filter(item => item.equipmentType === 'Battery').map(b => (
                                        <div key={b.id} className="flex flex-col p-3 bg-slate-50 rounded-lg border border-slate-100 group relative">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <div className="font-medium text-slate-800">{b.make} {b.model}</div>
                                                    <div className="text-xs text-slate-500">Battery {b.specs ? `• ${b.specs}` : ''} • Qty: {b.quantity}{b.weight ? ` • ${b.weight * b.quantity} lbs` : ''}</div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <div className="font-bold text-slate-700 mr-2">${formatNumber(b.price * b.quantity)}</div>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600" onClick={() => editGenericEquipment(b.id)}>
                                                        <PencilIcon className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600" onClick={() => deleteGenericEquipment(b.id)}>
                                                        <TrashIcon className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>

                        {/* Generics Output */}
                        {['Inverter', 'Charge Controller', 'Battery Monitor', 'DC Alternator Charger', 'Surge Protector', 'Other'].map(type => {
                            const items = genericEquipment.filter(item => item.equipmentType === type);

                            return (
                                <Card key={type} className="p-6 md:col-span-2">
                                    <h3 className="text-lg font-medium text-slate-800 mb-4">
                                        {type === 'Battery' ? 'Batteries' : `${type}${type === 'Other' ? '' : 's'}`}
                                    </h3>
                                    {items.length === 0 ? (
                                        <p className="text-sm text-slate-500">No {type === 'Battery' ? 'batteries' : type === 'Other' ? 'other items' : `${type.toLowerCase()}s`} configured.</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {items.map(item => (
                                                <div key={item.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100 group relative">
                                                    <div>
                                                        <div className="font-medium text-slate-800">{item.make} {item.model}</div>
                                                        <div className="text-xs text-slate-500">{item.specs ? `${item.specs} • ` : ''}Qty: {item.quantity}{item.weight ? ` • ${item.weight * item.quantity} lbs` : ''}</div>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <div className="font-bold text-slate-700 mr-2">${formatNumber(item.price * item.quantity)}</div>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600" onClick={() => editGenericEquipment(item.id)}>
                                                            <PencilIcon className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600" onClick={() => deleteGenericEquipment(item.id)}>
                                                            <TrashIcon className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </Card>
                            );
                        })}
                    </div>
                </TabsContent>

                {/* Solar Capture Tab */}
                {featureSolarCapture && (
                    <TabsContent value="capture" className="space-y-6">
                        <div className="grid lg:grid-cols-3 gap-6">
                            {/* Log Entry Form */}
                            <Card className="p-6 lg:col-span-1">
                                <h3 className="text-lg font-medium text-slate-800 mb-4">
                                    {editingLogId ? 'Edit Log Entry' : 'Log Solar Capture'}
                                </h3>
                                {editingLogId && (
                                    <Button variant="outline" size="sm" className="mb-2" onClick={() => { setEditingLogId(null); solarLogForm.reset({ date: new Date().toISOString().split('T')[0], weatherCondition: 'Sunny', sunHours: 0, generatedWh: 0 }); }}>Cancel Edit</Button>
                                )}
                                <Form {...solarLogForm}>
                                    <form onSubmit={solarLogForm.handleSubmit(onSolarLogSubmit)} className="space-y-4">
                                        <FormField control={solarLogForm.control} name="date" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Date</FormLabel>
                                                <FormControl><Input type="date" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={solarLogForm.control} name="weatherCondition" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Weather Condition</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        {(['Sunny', 'Partly Cloudy', 'Cloudy', 'Overcast', 'Bad Weather'] as WeatherCondition[]).map(w =>
                                                            <SelectItem key={w} value={w}>{getWeatherEmoji(w)} {w}</SelectItem>
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={solarLogForm.control} name="sunHours" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Direct Sun Hours</FormLabel>
                                                <FormControl><Input type="number" step="0.5" placeholder="e.g. 5.5" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={solarLogForm.control} name="generatedWh" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Actual Wh Generated</FormLabel>
                                                <FormControl><Input type="number" step="1" placeholder="e.g. 3200" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white">
                                            {editingLogId ? <><PencilIcon className="mr-2 h-4 w-4" /> Update Entry</> : <><PlusIcon className="mr-2 h-4 w-4" /> Log Entry</>}
                                        </Button>
                                    </form>
                                </Form>
                            </Card>

                            {/* Log History */}
                            <Card className="p-6 lg:col-span-2">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-medium text-slate-800">
                                        Capture History
                                    </h3>
                                    <Select value={logFilterMonth} onValueChange={setLogFilterMonth}>
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Filter by month" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Months</SelectItem>
                                            {getAvailableMonths().map(m => (
                                                <SelectItem key={m} value={m}>
                                                    {new Date(m + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Summary Stats */}
                                {getFilteredLogs().length > 0 && (
                                    <div className="grid grid-cols-3 gap-3 mb-4">
                                        <div className="bg-amber-50 p-3 rounded-lg text-center border border-amber-100">
                                            <div className="text-xs text-slate-500 mb-1">Avg Daily</div>
                                            <div className="font-bold text-lg text-amber-700">
                                                {formatNumber(Math.round(getFilteredLogs().reduce((s, l) => s + l.generatedWh, 0) / getFilteredLogs().length))} Wh
                                            </div>
                                        </div>
                                        <div className="bg-emerald-50 p-3 rounded-lg text-center border border-emerald-100">
                                            <div className="text-xs text-slate-500 mb-1">Best Day</div>
                                            <div className="font-bold text-lg text-emerald-700">
                                                {formatNumber(Math.max(...getFilteredLogs().map(l => l.generatedWh)))} Wh
                                            </div>
                                        </div>
                                        <div className="bg-blue-50 p-3 rounded-lg text-center border border-blue-100">
                                            <div className="text-xs text-slate-500 mb-1">Avg Sun Hrs</div>
                                            <div className="font-bold text-lg text-blue-700">
                                                {(getFilteredLogs().reduce((s, l) => s + l.sunHours, 0) / getFilteredLogs().length).toFixed(1)}h
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Log Entries */}
                                {getFilteredLogs().length === 0 ? (
                                    <p className="text-sm text-slate-500">No solar capture logs {logFilterMonth !== 'all' ? 'for this month' : 'yet'}. Start logging your daily generation!</p>
                                ) : (
                                    <div className="space-y-2 max-h-[500px] overflow-y-auto">
                                        {getFilteredLogs()
                                            .sort((a, b) => b.date.localeCompare(a.date))
                                            .map(log => (
                                                <div key={log.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100 group">
                                                    <div className="flex items-center gap-3">
                                                        <div className="text-2xl">{getWeatherEmoji(log.weatherCondition)}</div>
                                                        <div>
                                                            <div className="font-medium text-slate-800">
                                                                {new Date(log.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                                            </div>
                                                            <div className="text-xs text-slate-500">
                                                                {log.weatherCondition} • {log.sunHours}h sun
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <div className="font-bold text-slate-700 mr-2">{formatNumber(log.generatedWh)} <span className="text-xs font-normal">Wh</span></div>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600" onClick={() => editSolarLog(log.id)}>
                                                            <PencilIcon className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600" onClick={() => deleteSolarLog(log.id)}>
                                                            <TrashIcon className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                )}
                            </Card>
                        </div>
                    </TabsContent>
                )}
            </Tabs>

        </div>
    );
}
