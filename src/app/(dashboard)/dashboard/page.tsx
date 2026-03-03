"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HeaderHero } from "@/components/layout/header-hero";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { ArrowUp, ArrowRight, Droplet, DollarSign, Activity, Calendar, CheckCircle, Flame, Truck, Wrench } from "lucide-react";

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

const weightData = [
  { name: "Base Vehicle", value: 4850, color: "#e11d48" }, // Red
  { name: "Payload", value: 460, color: "#fbbf24" }, // Amber
  { name: "Towable", value: 0, color: "#10b981" }, // Green
  { name: "Water", value: 350, color: "#3b82f6" }, // Blue
  { name: "Equipment", value: 250, color: "#8b5cf6" }, // Purple
];

const recentActivity = [
  { id: 1, title: "Setup Item Purchased", desc: "Purchased 'Weight Dist & Sway Control Kit' ($649.99) - added 75 lbs.", date: "Today, 10:24 AM", icon: CheckCircle, color: "text-emerald-500" },
  { id: 2, title: "Roof Top Solar System", desc: "Purchased 2 x EcoFlow PV400 ($1,799.00). Added to setup inventory.", date: "Yesterday", icon: Flame, color: "text-amber-500" },
  { id: 3, title: "Water Tank Maintenance", desc: "Flushed grey & black tanks. Reset monitors.", date: "3 Days Ago", icon: Droplet, color: "text-blue-500" },
  { id: 4, title: "RV Warranty Registration", desc: "Completed setup tracking for extended warranty.", date: "Last Week", icon: Activity, color: "text-purple-500" },
  { id: 5, title: "Created Master Plan PDF", desc: "Exported current layout report for sharing.", date: "Last Month", icon: Truck, color: "text-slate-500" }
];

const upcomingEvents = [
  { id: 1, title: "Insurance Renewal", desc: "Progressive RV bundle renews.", date: "Mar 20, 2026", color: "text-blue-500" },
  { id: 2, title: "Tire Pressure Inspection", desc: "Check PSI across all 4 wheels before long transit.", date: "Apr 05, 2026", color: "text-amber-500" },
  { id: 3, title: "Seasonal Check", desc: "De-winterize plumbing systems and hook up water filter.", date: "May 10, 2026", color: "text-emerald-500" },
  { id: 4, title: "Battery System Maintenance", desc: "Check voltage and clean LFP terminals.", date: "Jul 15, 2026", color: "text-amber-500" },
];

export default function Dashboard() {
  return (
    <div className="container mx-auto py-10 px-4 md:px-8 max-w-6xl">
      <HeaderHero
        title="Welcome, Rob Bogatin!"
        description="RV MasterPlan Dashboard | Data Aggregation Overview"
        imageUrl="/images/page-headers/dashboard-header.jpg"
        imageClass="object-cover object-[center_70%]"
      />

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 mt-6">
        <Card className="border-t-4 border-t-[#2a4f3f]">
          <CardContent className="p-4 flex flex-col justify-center">
            <p className="text-sm text-slate-500 font-medium">Est Liability</p>
            <p className="text-2xl font-bold text-[#2a4f3f]">$18,644.00</p>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-t-[#8ca163]">
          <CardContent className="p-4 flex flex-col justify-center">
            <p className="text-sm text-slate-500 font-medium">Remaining Budget</p>
            <p className="text-2xl font-bold text-[#2a4f3f]">$185.98</p>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-t-[#2a4f3f]">
          <CardContent className="p-4 flex flex-col justify-center">
            <p className="text-sm text-slate-500 font-medium">Avg Daily Power</p>
            <p className="text-xl font-bold text-[#2a4f3f]">1,695 Wh / Day</p>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-t-[#8ca163]">
          <CardContent className="p-4 flex flex-col justify-center">
            <p className="text-sm text-slate-500 font-medium">Avg Daily Water</p>
            <p className="text-xl font-bold text-[#2a4f3f]">4.2 gal</p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-[#2a4f3f]">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm text-slate-500 font-medium">Financial Health</p>
              <p className="text-xl font-bold text-[#2a4f3f]">Excellent <span className="text-sm text-[#8ca163] font-semibold">90/100</span></p>
            </div>
            <div className="bg-[#f1f6ea] p-2 rounded-full h-10 w-10 flexitems-center justify-center">
              <ArrowUp className="h-5 w-5 text-[#8ca163]" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-t-[#8ca163]">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm text-slate-500 font-medium">Avg. Solar Coverage</p>
              <p className="text-xl font-bold text-[#2a4f3f]">450 <span className="text-sm text-[#8ca163] font-semibold">Wh / Day</span></p>
            </div>
            <div className="bg-[#f1f6ea] p-2 rounded-full h-10 w-10 flex items-center justify-center">
              <ArrowRight className="h-5 w-5 text-[#8ca163]" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-t-[#2a4f3f]">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm text-slate-500 font-medium">Estimated Water Supply</p>
              <p className="text-xl font-bold text-[#2a4f3f]">12.4 Days <span className="text-sm text-[#8ca163] font-semibold">Available</span></p>
            </div>
            <div className="bg-[#eef2f6] p-2 rounded-full h-10 w-10 flex items-center justify-center">
              <Droplet className="h-5 w-5 text-[#3b82f6]" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-t-[#8ca163]">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm text-slate-500 font-medium">YTD Expenses</p>
              <p className="text-xl font-bold text-[#2a4f3f]">$5,477.37</p>
            </div>
            <div className="bg-[#f1f6ea] p-2 rounded-full h-10 w-10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-[#8ca163]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expense Tracker Chart */}
      <Card className="mb-8 border border-slate-200">
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
                <Tooltip
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
      <Card className="mb-8 border border-slate-200">
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
              <p className="text-xl font-bold">250 lbs</p>
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
                  <Tooltip />
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

        <Card className="border border-slate-200">
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

        <Card className="border border-slate-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold text-slate-800">Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {upcomingEvents.map((evt, i) => (
                <div key={i} className="flex gap-4">
                  <div className={`mt-1 ${evt.color}`}>
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800">{evt.title}</h4>
                    <p className="text-xs text-slate-500 mb-1">{evt.desc}</p>
                    <p className="text-xs font-medium text-slate-700">{evt.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
