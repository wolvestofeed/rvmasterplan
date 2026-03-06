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
import { getSolarEquipment } from "@/app/actions/power";
import { getUserProfile, updateDashboardHeroImage } from "@/app/actions/profiles";
import { UploadButton } from "@/lib/uploadthing";
import { Camera } from "lucide-react";

// --- Mock Data for Dashboard ---
const expenseData = [
  { month: "Jan", budget: 500, actual: 500 },
  { month: "Feb", budget: 500, actual: 500 },
  { month: "Mar", budget: 500, actual: 500 },
  { month: "Apr", budget: 1500, actual: 800 },
  { month: "May", budget: 1500, actual: 1300 },
  { month: "Jun", budget: 1500, actual: 800 },
  { month: "Jul", budget: 2000, actual: 800 },
  { month: "Aug", budget: 1500, actual: 800 },
  { month: "Sep", budget: 850, actual: 800 },
  { month: "Oct", budget: 500, actual: 500 },
  { month: "Nov", budget: 500, actual: 800 },
  { month: "Dec", budget: 500, actual: 800 },
];

const estimatedDeviceWeight = 20; // Demo default from Power page

const recentActivity = [
  { id: 1, title: "Setup Item Purchased", desc: "Purchased 'Weight Dist & Sway Control Kit' ($649.99) - added 75 lbs.", date: "Today, 10:24 AM", icon: CheckCircle, color: "text-emerald-500" },
  { id: 2, title: "Roof Top Solar System", desc: "Purchased 2 x EcoFlow PV400 ($1,799.00). Added to setup inventory.", date: "Yesterday", icon: Flame, color: "text-amber-500" },
  { id: 3, title: "Water Tank Maintenance", desc: "Flushed grey & black tanks. Reset monitors.", date: "3 Days Ago", icon: Droplet, color: "text-blue-500" },
  { id: 4, title: "RV Warranty Registration", desc: "Completed setup tracking for extended warranty.", date: "Last Week", icon: Activity, color: "text-purple-500" },
  { id: 5, title: "Created Master Plan PDF", desc: "Exported current layout report for sharing.", date: "Last Month", icon: Truck, color: "text-slate-500" }
];
import { useState, useEffect } from "react";
import { getDashboardEvents, type DashboardEvent } from "@/app/actions/dashboard";
import { addManualEvent } from "@/app/actions/events";

const initialUpcomingEvents = [
  { id: 2, title: "Tire Pressure Inspection [Placeholder]", desc: "Check PSI across all 4 wheels before long transit.", date: "Apr 05, 2026", color: "text-amber-500", rawDate: new Date("2026-04-05"), source: "event" as any },
  { id: 3, title: "Seasonal Check [Placeholder]", desc: "De-winterize plumbing systems and hook up water filter.", date: "May 10, 2026", color: "text-emerald-500", rawDate: new Date("2026-05-10"), source: "event" as any },
  { id: 4, title: "Battery System Maintenance [Placeholder]", desc: "Check voltage and clean LFP terminals.", date: "Jul 15, 2026", color: "text-amber-500", rawDate: new Date("2026-07-15"), source: "event" as any },
];

export default function Dashboard() {
  const [events, setEvents] = useState<any[]>(initialUpcomingEvents);

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

  const fetchEvents = async () => {
    const res = await getDashboardEvents();
    if (res.success && res.data) {
      const combined = [...initialUpcomingEvents, ...res.data].sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime());
      setEvents(combined.slice(0, 8)); // Top 8 events
    }
  };

  const fetchEquipmentWeight = async () => {
    const res = await getSolarEquipment();
    if (res.success && res.data) {
      const solarEquipmentWeight = res.data.reduce((total: any, item: any) => total + ((Number(item.weight) || 0) * (Number(item.quantity) || 1)), 0);
      setComputedEquipmentWeight(solarEquipmentWeight + estimatedDeviceWeight);
    }
  };

  const fetchProfile = async () => {
    const res = await getUserProfile();
    if (res.success && res.data) {
      setHeroImage(res.data.dashboardHeroImage);
      setIsDemoMode(res.data.userId === "demo_user" || res.data.userId.startsWith("guest_"));
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchEquipmentWeight();
    fetchProfile();
  }, []);

  const weightData = [
    { name: "Base Vehicle", value: 4850, color: "#e11d48" }, // Red
    { name: "Payload", value: 460, color: "#fbbf24" }, // Amber
    { name: "Towable", value: 0, color: "#10b981" }, // Green
    { name: "Water", value: 350, color: "#3b82f6" }, // Blue
    { name: "Equipment", value: Math.round(computedEquipmentWeight), color: "#8b5cf6" }, // Purple
  ];

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
        title={isDemoMode ? "Welcome, Visitor!" : "Welcome, Rob Bogatin!"}
        description="RV MasterPlan Dashboard | Data Aggregation Overview"
        imageUrl={heroImage || (isDemoMode ? "/images/page-headers/demo-dashboard-header.jpg" : "/images/page-headers/dashboard-header.jpg")}
        imageClass="object-cover object-[center_70%]"
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

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 mt-6">
        <Card className="border-2 border-[#2a4f3f] shadow-[4px_4px_12px_rgba(0,0,0,0.25)] bg-gradient-to-br from-white/90 via-white/40 to-[#2a4f3f]/30">
          <CardContent className="p-4 flex flex-col justify-center">
            <p className="text-sm text-slate-500 font-medium">Est Liability</p>
            <p className="text-2xl font-bold text-[#2a4f3f]">$18,644.00</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-[#8ca163] shadow-[4px_4px_12px_rgba(0,0,0,0.25)] bg-gradient-to-br from-white/90 via-white/40 to-[#8ca163]/40">
          <CardContent className="p-4 flex flex-col justify-center">
            <p className="text-sm text-slate-500 font-medium">Remaining Budget</p>
            <p className="text-2xl font-bold text-[#2a4f3f]">$185.98</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-[#2a4f3f] shadow-[4px_4px_12px_rgba(0,0,0,0.25)] bg-gradient-to-br from-white/90 via-white/40 to-[#2a4f3f]/30">
          <CardContent className="p-4 flex flex-col justify-center">
            <p className="text-sm text-slate-500 font-medium">Avg Daily Power</p>
            <p className="text-xl font-bold text-[#2a4f3f]">1,695 Wh / Day</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-[#8ca163] shadow-[4px_4px_12px_rgba(0,0,0,0.25)] bg-gradient-to-br from-white/90 via-white/40 to-[#8ca163]/40">
          <CardContent className="p-4 flex flex-col justify-center">
            <p className="text-sm text-slate-500 font-medium">Avg Daily Water</p>
            <p className="text-xl font-bold text-[#2a4f3f]">4.2 gal</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-[#2a4f3f] shadow-[4px_4px_12px_rgba(0,0,0,0.25)] bg-gradient-to-br from-white/90 via-white/40 to-[#2a4f3f]/30">
          <CardContent className="p-4 flex flex-col justify-center">
            <div>
              <p className="text-sm text-slate-500 font-medium">Financial Health</p>
              <p className="text-xl font-bold text-[#2a4f3f]">Excellent <span className="text-sm text-[#8ca163] font-semibold">90/100</span></p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-[#8ca163] shadow-[4px_4px_12px_rgba(0,0,0,0.25)] bg-gradient-to-br from-white/90 via-white/40 to-[#8ca163]/40">
          <CardContent className="p-4 flex flex-col justify-center">
            <div>
              <p className="text-sm text-slate-500 font-medium">Avg. Solar Coverage</p>
              <p className="text-xl font-bold text-[#2a4f3f]">450 <span className="text-sm text-[#8ca163] font-semibold">Wh / Day</span></p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-[#2a4f3f] shadow-[4px_4px_12px_rgba(0,0,0,0.25)] bg-gradient-to-br from-white/90 via-white/40 to-[#2a4f3f]/30">
          <CardContent className="p-4 flex flex-col justify-center">
            <div>
              <p className="text-sm text-slate-500 font-medium">Estimated Water Supply</p>
              <p className="text-xl font-bold text-[#2a4f3f]">12.4 Days <span className="text-sm text-[#8ca163] font-semibold">Available</span></p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-[#8ca163] shadow-[4px_4px_12px_rgba(0,0,0,0.25)] bg-gradient-to-br from-white/90 via-white/40 to-[#8ca163]/40">
          <CardContent className="p-4 flex flex-col justify-center">
            <div>
              <p className="text-sm text-slate-500 font-medium">YTD Expenses</p>
              <p className="text-xl font-bold text-[#2a4f3f]">$5,477.37</p>
            </div>
          </CardContent>
        </Card>
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
              <BarChart data={expenseData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
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

      {/* RV Weight Distribution */}
      <Card className="mb-8">
        <CardHeader className="pb-4 border-b border-slate-100">
          <CardTitle className="text-lg font-bold text-slate-800">RV Weight Distribution</CardTitle>
          <p className="text-sm text-slate-500">Track varying load variables to maintain your ideal distribution.</p>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="border-b md:border-b-0 md:border-r border-slate-200 pb-4 md:pb-0 md:pr-4">
              <p className="text-sm text-slate-500">Dry Weight</p>
              <p className="text-2xl font-bold">4,850 lbs</p>
            </div>
            <div className="border-b md:border-b-0 md:border-r border-slate-200 pb-4 md:pb-0 md:pr-4">
              <p className="text-sm text-slate-500">Payload Capacity</p>
              <p className="text-2xl font-bold">1,910 lbs</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">GVWR</p>
              <p className="text-2xl font-bold">6,760 lbs</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-2">
            <div>
              <p className="text-sm text-slate-500">Equipment Weight</p>
              <p className="text-xl font-bold">{Math.round(computedEquipmentWeight).toLocaleString()} lbs</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Water Weight</p>
              <p className="text-xl font-bold">350 lbs</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Cargo Status</p>
              <p className="text-xl font-bold text-emerald-600">Normal Range</p>
              <p className="text-xs text-slate-500">Available payload: 1,310 lbs</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center mt-8 pt-6 border-t border-slate-100 h-[250px]">
            <div className="w-full md:w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={weightData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
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
            <div className="w-full md:w-1/2 pl-0 md:pl-8 mt-6 md:mt-0">
              <ul className="space-y-3">
                {weightData.map((item, i) => (
                  <li key={i} className="flex justify-between items-center text-sm">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></div>
                      <span className="text-slate-600">{item.name}</span>
                    </div>
                    <span className="font-medium text-slate-800">{item.value.toLocaleString()} lbs</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity and Events Split */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold text-slate-800">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {recentActivity.map((activity, i) => (
                <div key={i} className="flex gap-4">
                  <div className={`mt-1 ${activity.color}`}>
                    <activity.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800">{activity.title}</h4>
                    <p className="text-xs text-slate-500 mb-1">{activity.desc}</p>
                    <p className="text-xs text-slate-400">{activity.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold text-slate-800">Timeline & Deadlines</CardTitle>

            <Dialog open={isEventModalOpen} onOpenChange={setIsEventModalOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 text-[#2a4f3f] bg-[#2a4f3f]/10 hover:bg-[#2a4f3f]/20">
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
                    <Button disabled={isSubmitting} type="submit" className="bg-[#2a4f3f] hover:bg-[#1a3a2d] text-white">
                      {isSubmitting ? "Saving..." : "Save Event"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {events.length === 0 ? (
                <p className="text-sm text-slate-500">No upcoming events.</p>
              ) : (
                events.map((evt, i) => (
                  <div key={evt.id || i} className="flex gap-4">
                    <div className={`mt-1 ${evt.color}`}>
                      {getEventIcon(evt.source)}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800">{evt.title}</h4>
                      <p className="text-xs text-slate-500 mb-1">{evt.desc}</p>
                      <p className="text-xs font-medium text-slate-700">{evt.date}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
