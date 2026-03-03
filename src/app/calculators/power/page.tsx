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
    ImportIcon
} from "lucide-react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { toast } from "sonner";
import { formatNumber } from "@/lib/utils";

import {
    ElectricalDevice,
    EnergyData,
    SolarPanel,
    SolarBattery,
    SolarGenerator,
    DeviceCategory,
    DeviceGroup,
    SetupItem
} from "@/types";
import { mockDevices, mockEnergyData, mockSolarPanels, mockSolarBatteries, mockSolarGenerators, mockSetupItems } from "@/data/mockData";

const COLORS = ['#3b82f6', '#14b8a6', '#10b981', '#f59e0b', '#8b5cf6', '#f43f5e', '#ef4444', '#64748b'];

const deviceSchema = z.object({
    name: z.string().min(1, { message: "Name is required" }),
    group: z.enum(['Essential', 'Non-essential'] as const),
    category: z.string().min(1),
    watts: z.coerce.number().min(0),
    hoursPerDay: z.coerce.number().min(0),
});
type DeviceFormValues = z.infer<typeof deviceSchema>;

export default function PowerStrategyPage() {
    const [isClient, setIsClient] = useState(false);
    const [devices, setDevices] = useState<ElectricalDevice[]>(mockDevices as ElectricalDevice[]);
    const [energyData, setEnergyData] = useState<EnergyData>(mockEnergyData as EnergyData);
    const [panels, setPanels] = useState<SolarPanel[]>(mockSolarPanels as SolarPanel[]);
    const [batteries, setBatteries] = useState<SolarBattery[]>(mockSolarBatteries as SolarBattery[]);
    const [generators, setGenerators] = useState<SolarGenerator[]>(mockSolarGenerators as SolarGenerator[]);
    const [editingDeviceId, setEditingDeviceId] = useState<string | null>(null);

    useEffect(() => { setIsClient(true); }, []);

    const deviceForm = useForm<DeviceFormValues>({
        resolver: zodResolver(deviceSchema) as any,
        defaultValues: {
            name: "", group: "Essential", category: "Refrigeration", watts: 0, hoursPerDay: 0
        }
    });

    const getTotalDailyConsumption = () => {
        return devices.reduce((sum, d) => sum + (d.watts * d.hoursPerDay), 0);
    };

    const getTotalPanelWattage = () => {
        return panels.reduce((sum, p) => sum + (p.wattage * p.quantity), 0);
    };

    const getDailySolarGeneration = () => {
        const totalWatts = getTotalPanelWattage();
        const efficiencyFactor = 0.85;
        return Math.round(totalWatts * energyData.sunHours * efficiencyFactor);
    };

    const getTotalBatteryCapacity = () => {
        const standalone = batteries.reduce((sum, b) => sum + (b.capacityWh * b.quantity), 0);
        const genBats = generators.reduce((sum, g) => sum + (g.batteryCapacityWh * g.quantity), 0);
        return standalone + genBats;
    };

    const getBatteryRuntime = () => {
        const dailyConsumption = getTotalDailyConsumption();
        const hourlyConsumption = dailyConsumption / 24;
        if (hourlyConsumption <= 0) return 0;

        const usableCapacity = getTotalBatteryCapacity() * 0.8;
        return +(usableCapacity / hourlyConsumption).toFixed(1);
    };

    const onDeviceSubmit = (data: DeviceFormValues) => {
        if (editingDeviceId) {
            setDevices(devices.map(d => d.id === editingDeviceId ? { ...d, ...data, category: data.category as DeviceCategory } : d));
            setEditingDeviceId(null);
            toast.success("Device updated");
        } else {
            setDevices([...devices, { ...data, id: Date.now().toString(), category: data.category as DeviceCategory }]);
            toast.success("Device added");
        }
        deviceForm.reset({ name: "", group: "Essential", category: "Refrigeration", watts: 0, hoursPerDay: 0 });
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

    const importFromSetupBudget = () => {
        // We already have mockSetupItems. Let's simulate importing them.
        const energyItems = mockSetupItems.filter(item => item.category === 'ENERGY' && item.acquired);

        if (energyItems.length === 0) {
            toast.error("No acquired energy items found in Setup Budget.");
            return;
        }

        let panelsAdded = 0;
        let generatorsAdded = 0;

        const newPanels = [...panels];
        const newGenerators = [...generators];

        energyItems.forEach(item => {
            const name = item.name.toLowerCase();
            if (name.includes('panel')) {
                let wattage = 100;
                const match = name.match(/(\d+)\s*w/i);
                if (match && match[1]) wattage = parseInt(match[1], 10);
                newPanels.push({
                    id: Date.now().toString() + Math.random(),
                    make: "Imported", model: item.name, wattage, quantity: 1, efficiency: 21, type: "rigid", cellType: "Mono", weight: item.weight || 10
                });
                panelsAdded++;
            } else if (name.includes('generator') || name.includes('ecoflow')) {
                let capacity = 3600;
                newGenerators.push({
                    id: Date.now().toString() + Math.random(),
                    make: "Imported", model: item.name, outputWatts: capacity, batteryCapacityWh: capacity, systemType: "generator", chargeControllerType: "MPPT", rechargeTime120V: 2, rechargeTimeSolar: 4, has12VOutput: true, has30AmpOutput: true, acOutlets: 4, usbPorts: 4, dcPorts: 1, weight: item.weight || 90, quantity: 1
                });
                generatorsAdded++;
            }
        });

        setPanels(newPanels);
        setGenerators(newGenerators);
        toast.success(`Imported ${panelsAdded} panels and ${generatorsAdded} generators!`);
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
            <div className="mb-6">
                <Button variant="ghost" asChild className="-ml-4 text-muted-foreground hover:text-foreground">
                    <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Link>
                </Button>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <h1 className="text-3xl font-heading font-bold text-gray-900 flex items-center">
                    <ZapIcon className="mr-3 h-8 w-8 text-amber-500" />
                    Power Strategy & Solar
                </h1>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={importFromSetupBudget} className="flex items-center">
                        <ImportIcon className="mr-2 h-4 w-4" /> Import from Budget
                    </Button>
                    <Button onClick={saveOverallData} className="flex items-center bg-amber-600 hover:bg-amber-700">
                        <SaveIcon className="mr-2 h-4 w-4" /> Save Strategy
                    </Button>
                </div>
            </div>

            {/* Hero Analytics Dash */}
            <Card className="p-6 bg-slate-50 border border-slate-200 mb-8 border-t-2 border-t-amber-500 shadow-md shadow-amber-900/5">
                <h3 className="text-lg font-medium text-slate-800 mb-4">Energy Balance</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm text-center">
                        <div className="text-sm text-slate-500 mb-1">Daily Consumption</div>
                        <div className="font-bold text-3xl text-rose-600">{formatNumber(getTotalDailyConsumption())} <span className="text-sm font-normal">Wh</span></div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm text-center">
                        <div className="text-sm text-slate-500 mb-1">Daily Solar Gen</div>
                        <div className="font-bold text-3xl text-amber-500">{formatNumber(getDailySolarGeneration())} <span className="text-sm font-normal">Wh</span></div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm text-center">
                        <div className="text-sm text-slate-500 mb-1">Battery Storage</div>
                        <div className="font-bold text-3xl text-emerald-600">{formatNumber(getTotalBatteryCapacity())} <span className="text-sm font-normal">Wh</span></div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm text-center">
                        <div className="text-sm text-slate-500 mb-1">Est. Runtime no Sun</div>
                        <div className="font-bold text-3xl text-blue-600">{getBatteryRuntime()} <span className="text-sm font-normal">hrs</span></div>
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
                <TabsList className="mb-6 grid w-full grid-cols-2 max-w-md">
                    <TabsTrigger value="load">Electrical Load</TabsTrigger>
                    <TabsTrigger value="solar">Solar Equipment</TabsTrigger>
                </TabsList>

                <TabsContent value="load" className="space-y-6">
                    <div className="grid lg:grid-cols-3 gap-6">
                        <div className="space-y-6 lg:col-span-1">
                            <Card className="p-6">
                                <h3 className="text-lg font-medium text-slate-800 mb-4 flex items-center">
                                    <ActivityIcon className="mr-2 h-5 w-5 text-slate-500" />
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
                                <div className="p-6 border-b border-slate-100 bg-slate-50">
                                    <h3 className="text-lg font-medium text-slate-800">Device Inventory</h3>
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
                                                        className={`p-4 flex flex-col sm:flex-row gap-4 sm:items-center justify-between transition-all duration-200 ${isEditing
                                                                ? 'bg-purple-50 border-l-4 border-purple-500 shadow-sm rounded-r-md'
                                                                : 'hover:bg-slate-50'
                                                            }`}
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <div>
                                                                <div className={`font-medium ${isEditing ? 'text-purple-900' : 'text-slate-800'}`}>
                                                                    {device.name} {isEditing && <span className="text-xs ml-2 bg-purple-200 text-purple-700 px-2 py-0.5 rounded-full">Editing</span>}
                                                                </div>
                                                                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                                                                    <span className={`px-2 py-0.5 rounded-full font-medium ${device.group === 'Essential' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600'}`}>
                                                                        {device.group}
                                                                    </span>
                                                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-medium">
                                                                        {device.category}
                                                                    </span>
                                                                    <span className="text-slate-500">{device.watts}W × {device.hoursPerDay}h</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center justify-between sm:justify-end gap-6 sm:ml-0">
                                                            <div className="text-right">
                                                                <div className={`font-bold ${isEditing ? 'text-purple-700' : 'text-slate-700'}`}>{formatNumber(device.watts * device.hoursPerDay)} <span className="text-xs font-normal">Wh/d</span></div>
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
                    <div className="grid md:grid-cols-2 gap-6">
                        <Card className="p-6">
                            <h3 className="text-lg font-medium text-slate-800 mb-4 flex items-center">
                                <SunIcon className="mr-2 h-5 w-5 text-amber-500" /> Solar Panels
                            </h3>
                            {panels.length === 0 ? <p className="text-sm text-slate-500">No solar panels configured.</p> : (
                                <div className="space-y-3">
                                    {panels.map(p => (
                                        <div key={p.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                                            <div>
                                                <div className="font-medium text-slate-800">{p.model}</div>
                                                <div className="text-xs text-slate-500">{p.wattage}W • Quantity: {p.quantity}</div>
                                            </div>
                                            <div className="font-bold text-slate-700">{p.wattage * p.quantity}W</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>

                        <Card className="p-6">
                            <h3 className="text-lg font-medium text-slate-800 mb-4 flex items-center">
                                <BatteryChargingIcon className="mr-2 h-5 w-5 text-emerald-500" /> Batteries & Generators
                            </h3>
                            {generators.length === 0 && batteries.length === 0 ? <p className="text-sm text-slate-500">No storage configured.</p> : (
                                <div className="space-y-3">
                                    {generators.map(g => (
                                        <div key={g.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                                            <div>
                                                <div className="font-medium text-slate-800">{g.model}</div>
                                                <div className="text-xs text-slate-500">Generator • Quantiy: {g.quantity}</div>
                                            </div>
                                            <div className="font-bold text-slate-700">{g.batteryCapacityWh * g.quantity}Wh</div>
                                        </div>
                                    ))}
                                    {batteries.map(b => (
                                        <div key={b.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                                            <div>
                                                <div className="font-medium text-slate-800">{b.model}</div>
                                                <div className="text-xs text-slate-500">Battery • Quantiy: {b.quantity}</div>
                                            </div>
                                            <div className="font-bold text-slate-700">{b.capacityWh * b.quantity}Wh</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>

        </div>
    );
}
