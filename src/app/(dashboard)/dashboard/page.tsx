"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HeaderHero } from "@/components/layout/header-hero";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Droplet, Activity, Calendar, CheckCircle, Flame, Truck, Plus, FileText, ShoppingBag, Bell } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { getSolarEquipment, getElectricalDevices } from "@/app/actions/power";
import { getWaterActivities, getWaterSystem, getTankLogs } from "@/app/actions/water";
import { getFinancialData, getRVVehicle } from "@/app/actions/financials";
import { getExpenses, getTargetBudgets } from "@/lib/actions/budget";
import { getUserProfile, updateDashboardHeroImage } from "@/app/actions/profiles";
import { getDashboardEvents, type DashboardEvent } from "@/app/actions/dashboard";
import { addManualEvent } from "@/app/actions/events";
import { getUserLocation } from "@/app/actions/weather";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { UploadButton } from "@/lib/uploadthing";
import { Camera } from "lucide-react";
import { KpiValue } from "@/components/ui/kpi-value";
import { KpiBlock, KpiBlockSkeleton } from "@/components/ui/kpi-block";

const estimatedDeviceWeight = 20; // Demo default from Power page

export default function Dashboard() {
  // --- State for Dashboard Activity & Events ---
  const [events, setEvents] = useState<DashboardEvent[]>([]);
  const [monthlyExpenseData, setMonthlyExpenseData] = useState<{ month: string; budget: number; actual: number }[]>([]);
  const [activityFeed, setActivityFeed] = useState<{ id: string; title: string; desc: string; rawDate: Date; date: string; icon: typeof ShoppingBag; color: string }[]>([]);

  // Modal State
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventType, setNewEventType] = useState("Maintenance");
  const [newEventDate, setNewEventDate] = useState("");
  const [newEventDesc, setNewEventDesc] = useState("");

  const [computedEquipmentWeight, setComputedEquipmentWeight] = useState(estimatedDeviceWeight);
  const [heroImage, setHeroImage] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [dailyConsumption, setDailyConsumption] = useState(0);
  const [dailyWater, setDailyWater] = useState(0);
  const [liability, setLiability] = useState(0);
  const [remainingBudget, setRemainingBudget] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalBatteryCapacity, setTotalBatteryCapacity] = useState(0);
  const [waterSupplyDays, setWaterSupplyDays] = useState(0);
  const [healthScore, setHealthScore] = useState(100);
  const [healthText, setHealthText] = useState("Excellent");
  const [dryWeight, setDryWeight] = useState(0);
  const [gvwr, setGvwr] = useState(0);
  const [profileName, setProfileName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [weatherPSH, setWeatherPSH] = useState<number | null>(null);
  const [weatherCloud, setWeatherCloud] = useState<number | null>(null);
  const [weatherSunset, setWeatherSunset] = useState<string | null>(null);
  const [hasLocation, setHasLocation] = useState(false);

  const fetchEvents = async () => {
    const res = await getDashboardEvents();
    if (res.success && res.data) {
      setEvents(res.data.slice(0, 8)); // Top 8 events
    }
  };

  const fetchDashboardData = async () => {
    try {
    const [resSolar, resDevices, resWater, resWaterSys, resFin, resExp, resInc, resLogs, resRV] = await Promise.all([
      getSolarEquipment(),
      getElectricalDevices(),
      getWaterActivities(),
      getWaterSystem(),
      getFinancialData(),
      getExpenses(new Date().getFullYear()),
      getTargetBudgets(new Date().getFullYear()),
      getTankLogs(),
      getRVVehicle()
    ]);

    if (resRV.success && resRV.data) {
      setDryWeight(Number(resRV.data.dryWeightLbs) || 0);
      setGvwr(Number(resRV.data.gvwrLbs) || 0);
    }

    if (resSolar.success && resSolar.data) {
      type SolarItem = { weight?: string | null; quantity?: number | null; equipmentType?: string | null; wattage?: string | null };
      const solarEquipmentWeight = (resSolar.data as SolarItem[]).reduce((total, item) => total + ((Number(item.weight) || 0) * (Number(item.quantity) || 1)), 0);
      setComputedEquipmentWeight(solarEquipmentWeight + estimatedDeviceWeight);

      const batteries = (resSolar.data as SolarItem[]).filter(e => e.equipmentType === 'Battery');
      const generators = (resSolar.data as SolarItem[]).filter(e => e.equipmentType === 'Generator');

      const standalone = batteries.reduce((sum, b) => sum + ((Number(b.wattage) || 0) * (Number(b.quantity) || 1)), 0);
      const genBats = generators.reduce((sum, g) => sum + ((Number(g.wattage) || 0) * (Number(g.quantity) || 1)), 0);
      setTotalBatteryCapacity(standalone + genBats);
    }

    if (resDevices.success && resDevices.data) {
      type DeviceItem = { watts?: string | null; hoursPerDay?: string | null };
      const totalConsumption = (resDevices.data as DeviceItem[]).reduce((sum, d) => sum + (Number(d.watts) * Number(d.hoursPerDay) || 0), 0);
      setDailyConsumption(totalConsumption);
    }

    let currentDailyWater = 0;
    if (resWater.success && resWater.data) {
      type WaterItem = { gallonsPerUse?: string | null; timesPerDay?: string | null };
      currentDailyWater = (resWater.data as WaterItem[]).reduce((sum, act) => sum + (Number(act.gallonsPerUse) * Number(act.timesPerDay) || 0), 0);
      setDailyWater(currentDailyWater);
    }

    if (resWaterSys.success && resWaterSys.data) {
      const freshCap = resWaterSys.data.freshWaterCapacity || 40;
      let fresh = freshCap;

      // Project levels based on tank logs (matching Water Calculator logic)
      if (resLogs.success && resLogs.data) {
        type TankLog = { date: string; tank?: string; type?: string; volume?: string | null; id?: string };
        const sortedLogs = ([...resLogs.data] as TankLog[]).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

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
              if (log.type === 'Fill') fresh = Math.min(freshCap, fresh + Number(log.volume));
              if (log.type === 'Dump') fresh = Math.max(0, fresh - Number(log.volume));
            }
            logIndex++;
          }

          fresh = Math.max(0, fresh - currentDailyWater);
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }

      setWaterSupplyDays(currentDailyWater > 0 ? fresh / currentDailyWater : 999);
    }

    if (resFin.success && resFin.data) {
      const d = resFin.data;
      const principal = (Number(d.purchasePrice) || 0) + (Number(d.accessories) || 0) + (Number(d.extendedWarranty) || 0) + (Number(d.registrationFees) || 0) - (Number(d.downPayment) || 0) - (Number(d.tradeInValue) || 0);
      setLiability(Math.max(0, principal));
    }

    let tExp = 0;
    let tInc = 0;
    type ExpItem = { id: string; name?: string; amount?: string | null; category?: string; month?: number; year?: number; createdAt?: Date | string | null };
    type BudgetItem = { month?: number; year?: number; amount?: string | null };
    const allActivity: { id: string; title: string; desc: string; rawDate: Date; date: string; icon: typeof ShoppingBag; color: string }[] = [];

    if (Array.isArray(resExp)) {
      tExp = (resExp as ExpItem[]).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
      setTotalExpenses(tExp);

      (resExp as ExpItem[]).forEach((e) => {
        // Build activity feed
        const d = new Date(e.createdAt);
        allActivity.push({
          id: `exp_${e.id}`,
          title: `Expense: ${e.name}`,
          desc: `Spent $${Number(e.amount).toFixed(2)} in ${e.category || 'General'}`,
          rawDate: d,
          date: d.toLocaleDateString("en-US", { month: "short", day: "2-digit" }),
          icon: ShoppingBag,
          color: "text-amber-500"
        });
      });
    }

    if (Array.isArray(resInc)) {
      tInc = (resInc as BudgetItem[]).reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
    }

    // Generate monthly chart metrics for visual
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const expenseMap = monthNames.map(m => ({ month: m, budget: 0, actual: 0 }));

    if (Array.isArray(resInc)) {
      (resInc as BudgetItem[]).forEach((i) => {
        const mIndex = (Number(i.month) || 1) - 1;
        if (expenseMap[mIndex]) expenseMap[mIndex].budget += (Number(i.amount) || 0);
      });
    }

    if (Array.isArray(resExp)) {
      (resExp as ExpItem[]).forEach((e) => {
        const mIndex = (Number(e.month) || (new Date(e.createdAt as string).getMonth() + 1)) - 1;
        if (expenseMap[mIndex]) expenseMap[mIndex].actual += (Number(e.amount) || 0);
      });
    }

    setMonthlyExpenseData(expenseMap);

    // Also add water log activity to feed
    if (resLogs.success && resLogs.data) {
      (resLogs.data as TankLog[]).forEach((log) => {
        if (log.type === 'Dump') {
          const d = new Date(log.date);
          allActivity.push({
            id: `log_${log.id}`,
            title: `${log.tank} Tank Dumped`,
            desc: `Disposed of ${log.volume} gallons.`,
            rawDate: d,
            date: d.toLocaleDateString("en-US", { month: "short", day: "2-digit" }),
            icon: Droplet,
            color: "text-blue-500"
          });
        }
      });
    }

    // Grab some setup records too, if recently tracked (using logs that match 'Equipment')
    // Fallback: If no activity, keep array empty.
    const sortedActivity = allActivity.sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime()).slice(0, 8);
    setActivityFeed(sortedActivity);

    // Strict Living Budget Math
    const currentMonthNum = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    let monthTarget = 0;
    if (Array.isArray(resInc)) {
      const targetRow = (resInc as BudgetItem[]).find((i) => Number(i.month) === currentMonthNum && Number(i.year) === currentYear);
      if (targetRow) monthTarget = Number(targetRow.amount) || 0;
    }

    let monthExpenses = 0;
    if (Array.isArray(resExp)) {
      const filteredExps = (resExp as ExpItem[]).filter((e) => Number(e.month) === currentMonthNum && Number(e.year) === currentYear);
      monthExpenses = filteredExps.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    }

    setRemainingBudget(monthTarget - monthExpenses);

    const annualBudget = tInc;
    const percentUsed = annualBudget > 0 ? (tExp / annualBudget) * 100 : 0;
    const isBudgetOkay = percentUsed <= 100;
    const score = Math.max(10, Math.round(100 - (percentUsed * (isBudgetOkay ? 0.15 : 0.9))));
    setHealthScore(score);
    if (score >= 80) setHealthText("Excellent");
    else if (score >= 60) setHealthText("Good");
    else if (score >= 40) setHealthText("Fair");
    else setHealthText("Poor");
    } catch (error) {
      console.error("Dashboard data fetch failed:", error);
    }
  };

  const fetchProfile = async () => {
    const res = await getUserProfile();
    if (res.success && res.data) {
      setHeroImage(res.data.dashboardHeroImage);
      setIsDemoMode(res.data.userId === "demo_user" || res.data.userId.startsWith("guest_"));
      const first = res.data.firstName || "";
      const last = res.data.lastName || "";
      setProfileName(`${first} ${last}`.trim());
    }
  };

  const fetchWeatherKpis = async () => {
    try {
      const locRes = await getUserLocation();
      if (!locRes.success || !locRes.data?.lat || !locRes.data?.lon) return;
      setHasLocation(true);
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${locRes.data.lat}&longitude=${locRes.data.lon}&daily=sunrise,sunset&hourly=shortwave_radiation,cloudcover&timezone=auto&forecast_days=1`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.hourly) {
        const now = new Date().getHours();
        const todayStr = data.daily?.time?.[0] || "";
        let psh = 0;
        let cloudSum = 0;
        let cloudCount = 0;
        data.hourly.time.forEach((t: string, i: number) => {
          if (t.startsWith(todayStr)) {
            psh += (data.hourly.shortwave_radiation[i] || 0) / 1000;
            const h = new Date(t).getHours();
            if (h <= now) { cloudSum += data.hourly.cloudcover[i] || 0; cloudCount++; }
          }
        });
        setWeatherPSH(psh);
        setWeatherCloud(cloudCount > 0 ? Math.round(cloudSum / cloudCount) : 0);
      }
      if (data.daily?.sunset?.[0]) {
        const ss = new Date(data.daily.sunset[0]);
        const now = new Date();
        const diff = ss.getTime() - now.getTime();
        if (diff > 0) {
          const hrs = Math.floor(diff / 3600000);
          const mins = Math.round((diff % 3600000) / 60000);
          setWeatherSunset(`${hrs}h ${mins}m`);
        } else {
          setWeatherSunset("Past");
        }
      }
    } catch (e) {
      console.error("Weather KPI fetch failed:", e);
    }
  };

  useEffect(() => {
    Promise.all([fetchEvents(), fetchDashboardData(), fetchProfile(), fetchWeatherKpis()]).finally(() => setIsLoading(false));
  }, []);

  const payloadCapacity = gvwr > 0 ? gvwr - dryWeight : 0;
  const waterWeight = Math.round(dailyWater * waterSupplyDays * 8.34); // gallons * lbs per gallon
  const availablePayload = Math.max(0, payloadCapacity - computedEquipmentWeight - waterWeight);

  const weightData = useMemo(() => [
    { name: "Base Vehicle", value: dryWeight, color: "#e11d48" },
    { name: "Payload Available", value: availablePayload, color: "#fbbf24" },
    { name: "Water", value: waterWeight, color: "#3b82f6" },
    { name: "Equipment", value: Math.round(computedEquipmentWeight), color: "#8b5cf6" },
  ], [dryWeight, availablePayload, waterWeight, computedEquipmentWeight]);

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle || !newEventDate) {
      toast.error("Title and Date are required.");
      return;
    }

    setIsSubmitting(true);
    const res = await addManualEvent({
      title: newEventTitle,
      eventType: newEventType,
      scheduledDate: new Date(newEventDate),
      notes: newEventDesc
    });

    if (res.success) {
      toast.success("Event scheduled!");
      setIsEventModalOpen(false);
      setNewEventTitle("");
      setNewEventDesc("");
      setNewEventDate("");
      await fetchEvents();
    } else {
      toast.error("Failed to add event.");
    }
    setIsSubmitting(false);
  };

  const getEventIcon = (source: string) => {
    switch (source) {
      case "document": return <FileText className="w-5 h-5" />;
      case "equipment": return <ShoppingBag className="w-5 h-5" />;
      case "subscription": return <Activity className="w-5 h-5" />;
      default: return <Calendar className="w-5 h-5" />;
    }
  };
  return (
    <div className="container mx-auto py-10 px-4 md:px-8 max-w-6xl">
      <HeaderHero
        title={isDemoMode ? "Welcome, Visitor!" : `Welcome, ${profileName || "RV Owner"}!`}
        description="RV MasterPlan Dashboard"
        imageUrl={heroImage || (isDemoMode ? "/images/page-headers/demo-dashboard-header.jpg" : "/images/page-headers/dashboard-header.jpg")}
        imageClass={isDemoMode ? "object-contain object-center bg-[#f8fbf5]" : "object-cover object-[center_70%]"}
        hideOverlay={isDemoMode}
      >
        <div className="absolute top-4 right-4 z-10 overflow-hidden rounded-md opacity-30 hover:opacity-100 transition-opacity bg-black/60 p-1 flex items-center justify-center">
          <UploadButton
            endpoint="heroImageUploader"
            onClientUploadComplete={async (res) => {
              if (res && res.length > 0) {
                const url = res[0].url;
                await updateDashboardHeroImage(url);
                setHeroImage(url);
                toast.success("Hero image updated!");
              }
            }}
            onUploadError={(error: Error) => {
              toast.error(`Upload failed: ${error.message}`);
            }}
            appearance={{
              button: "bg-transparent text-white cursor-pointer h-8 px-2 flex gap-2 items-center text-sm outline-none focus-within:ring-0 after:hidden ring-0",
              allowedContent: "hidden"
            }}
            content={{
              button({ ready }) {
                if (ready) return <><Camera className="w-4 h-4" /> <span className="hidden sm:inline">Change Photo</span></>;
                return "Loading...";
              }
            }}
          />
        </div>
      </HeaderHero>

      {/* KPI Grid — grouped by category: Financial, Power, Water */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 mt-6">
        {isLoading ? (
          <>
            <KpiBlockSkeleton variant="primary" />
            <KpiBlockSkeleton variant="accent" />
            <KpiBlockSkeleton variant="primary" />
            <KpiBlockSkeleton variant="accent" />
            <KpiBlockSkeleton variant="solar" />
            <KpiBlockSkeleton variant="solar" />
            <KpiBlockSkeleton variant="water" />
            <KpiBlockSkeleton variant="water" />
          </>
        ) : (
          <>
            {/* Row 1: Financial */}
            <KpiBlock label="Estimated Liability" variant="primary">
              <KpiValue>${liability.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</KpiValue>
            </KpiBlock>
            <KpiBlock label="YTD to Budget Health" variant="accent">
              <KpiValue>{healthText} <span className="text-sm text-brand-accent font-semibold">{healthScore}/100</span></KpiValue>
            </KpiBlock>
            <KpiBlock label="Remaining Monthly Budget" variant="primary">
              <KpiValue>${remainingBudget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</KpiValue>
            </KpiBlock>
            <KpiBlock label="YTD Expenses" variant="accent">
              <KpiValue>${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</KpiValue>
            </KpiBlock>

            {/* Row 2: Power (Solar Orange) + Water (Blue) */}
            <KpiBlock label="Average Solar Use" variant="solar">
              <KpiValue>{Math.round(dailyConsumption).toLocaleString()} <span className="text-sm text-brand-solar font-semibold">Wh / Day</span></KpiValue>
            </KpiBlock>
            <KpiBlock label="Estimated Runtime No Sun" variant="solar">
              <KpiValue>
                {dailyConsumption > 0 ? (totalBatteryCapacity / (dailyConsumption / 24)).toFixed(1) : '∞'} <span className="text-sm font-normal">hrs</span>
              </KpiValue>
            </KpiBlock>
            <KpiBlock label="Avg Daily Water Use" variant="water">
              <KpiValue>{dailyWater.toFixed(1)} gal</KpiValue>
            </KpiBlock>
            <KpiBlock label="Estimated Water Supply" variant="water">
              <KpiValue>{waterSupplyDays === 999 ? "∞" : waterSupplyDays.toFixed(1)} Days <span className="text-sm text-brand-blue-accent font-semibold">Available</span></KpiValue>
            </KpiBlock>

            {/* Row 3: Weather, Sun & Moon */}
            {hasLocation ? (
              <>
                <KpiBlock label="Peak Sun Hours" variant="solar">
                  <KpiValue>{weatherPSH !== null ? `${weatherPSH.toFixed(1)} hrs` : "—"}</KpiValue>
                </KpiBlock>
                <KpiBlock label="Cloud Cover" variant="water">
                  <KpiValue>{weatherCloud !== null ? `${weatherCloud}%` : "—"}</KpiValue>
                </KpiBlock>
                <KpiBlock label="Sunset Countdown" variant="solar">
                  <KpiValue>{weatherSunset || "—"}</KpiValue>
                </KpiBlock>
                <KpiBlock label="Weather, Sun & Moon" variant="accent">
                  <Link href="/weather" className="text-sm text-brand-primary font-semibold hover:underline">View Full Report →</Link>
                </KpiBlock>
              </>
            ) : (
              <KpiBlock label="Weather, Sun & Moon" variant="solar" className="col-span-2 md:col-span-4">
                <Link href="/weather" className="text-sm text-brand-primary font-semibold hover:underline">Set your location to see solar & weather KPIs →</Link>
              </KpiBlock>
            )}
          </>
        )}
      </div>

      {/* Expense Tracker Chart */}
      <Card className="mb-8">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-bold text-slate-800">Monthly Expense Tracker</CardTitle>
          <p className="text-sm text-slate-500">Your planned budget vs. actual spending over time.</p>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyExpenseData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                <RechartsTooltip
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="budget" name="Budget" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="actual" name="Actual" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Grouped Weight and Timelines */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* RV Weight Distribution */}
        <Card className="flex flex-col">
          <CardHeader className="pb-4 border-b border-slate-100">
            <CardTitle className="text-lg font-bold text-slate-800">RV Weight Distribution</CardTitle>
            <p className="text-sm text-slate-500">Maintain ideal distribution across varying loads.</p>
          </CardHeader>
          <CardContent className="pt-6 flex-1 flex flex-col">
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Dry Weight</p>
                <p className="text-lg font-bold text-slate-700">{dryWeight.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">lbs</span></p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Payload Cap</p>
                <p className="text-lg font-bold text-slate-700">{payloadCapacity.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">lbs</span></p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">GVWR</p>
                <p className="text-lg font-bold text-slate-700">{gvwr.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">lbs</span></p>
              </div>
            </div>

            <div className="flex flex-col items-center flex-1 justify-center">
              <div className="w-full h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={weightData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {weightData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="w-full mt-4">
                <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {weightData.map((item, i) => (
                    <li key={i} className="flex justify-between items-center text-xs">
                      <div className="flex items-center truncate">
                        <div className="w-2.5 h-2.5 rounded-full mr-1.5 shrink-0" style={{ backgroundColor: item.color }}></div>
                        <span className="text-slate-500 truncate">{item.name}</span>
                      </div>
                      <span className="font-semibold text-slate-700">{item.value.toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
                    <span className="text-xs font-medium text-slate-500">Status:</span>
                    <span className={`text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${availablePayload > 200 ? "bg-emerald-50 text-emerald-700" : availablePayload > 0 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}>
                        {availablePayload > 200 ? "Normal Range" : availablePayload > 0 ? "Near Limit" : "Overweight"}
                    </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timeline & Deadlines */}
        <Card className="flex flex-col">
          <CardHeader className="pb-4 flex flex-row items-center justify-between border-b border-slate-100">
            <div>
              <CardTitle className="text-lg font-bold text-slate-800">Timeline & Deadlines</CardTitle>
              <p className="text-sm text-slate-500">Upcoming maintenance and events.</p>
            </div>

            <Dialog open={isEventModalOpen} onOpenChange={setIsEventModalOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 text-brand-primary bg-brand-primary/10 hover:bg-brand-primary/20">
                  <Plus className="w-4 h-4 mr-1" /> Add Event
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleAddEvent}>
                  <DialogHeader>
                    <DialogTitle>Schedule an Event</DialogTitle>
                    <DialogDescription>
                      Add manual maintenance logs, reminders, or deadlines to your timeline.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="title">Event Title</Label>
                      <Input id="title" placeholder="e.g. Inspect Roof Seals" value={newEventTitle} onChange={e => setNewEventTitle(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                       <Label htmlFor="type">Event Type</Label>
                       <Select value={newEventType} onValueChange={setNewEventType}>
                         <SelectTrigger>
                           <SelectValue placeholder="Select type" />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="Maintenance">Maintenance</SelectItem>
                           <SelectItem value="Reminder">Reminder</SelectItem>
                           <SelectItem value="Custom">Custom Note</SelectItem>
                         </SelectContent>
                       </Select>
                     </div>
                     <div className="grid gap-2">
                       <Label htmlFor="date">Scheduled Date</Label>
                       <Input id="date" type="date" value={newEventDate} onChange={e => setNewEventDate(e.target.value)} />
                     </div>
                     <div className="grid gap-2">
                       <Label htmlFor="desc">Description / Notes (Optional)</Label>
                       <Input id="desc" placeholder="Details about this event..." value={newEventDesc} onChange={e => setNewEventDesc(e.target.value)} />
                     </div>
                   </div>
                   <DialogFooter>
                     <Button disabled={isSubmitting} type="submit" className="bg-brand-primary hover:bg-brand-primary-dark text-white">
                       {isSubmitting ? "Saving..." : "Save Event"}
                     </Button>
                   </DialogFooter>
                 </form>
               </DialogContent>
             </Dialog>

          </CardHeader>
          <CardContent className="pt-6 flex-1">
            <div className="space-y-6">
              {events.length === 0 ? (
                <p className="text-sm text-slate-500 italic py-4 text-center">No upcoming events.</p>
              ) : (
                events.map((evt, i) => (
                  <div key={evt.id || i} className="flex gap-4">
                    <div className={`mt-1 ${evt.color} shrink-0`}>
                      {getEventIcon(evt.source)}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800">{evt.title}</h4>
                      <p className="text-xs text-slate-500 mb-1 line-clamp-1">{evt.desc}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{evt.date}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity — Full Width */}
      <Card className="mb-10">
        <CardHeader className="pb-4 border-b border-slate-100">
          <CardTitle className="text-lg font-bold text-slate-800">Recent Activity</CardTitle>
          <p className="text-sm text-slate-500">Your recent financial and logistical logs.</p>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-6">
            {activityFeed.length === 0 ? (
              <p className="text-sm text-slate-500 italic py-4 text-center col-span-full">No recent activity.</p>
            ) : (
              activityFeed.map((activity, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className={`mt-1 ${activity.color} shrink-0 p-2 bg-slate-50 rounded-lg`}>
                    <activity.icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-slate-800 truncate">{activity.title}</h4>
                    <p className="text-xs text-slate-500 mb-1 line-clamp-2 leading-relaxed">{activity.desc}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{activity.date}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
