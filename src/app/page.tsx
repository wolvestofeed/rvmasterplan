import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sun, Droplets, Wallet, Calculator, FileText } from "lucide-react";

export default function Home() {
  return (
    <div className="container mx-auto py-10 px-4 md:px-8 max-w-6xl">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">RV Masterplan</h1>
          <p className="text-muted-foreground text-lg">Design and manage your optimal RV setup</p>
        </div>
        <div className="bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-sm font-medium border border-amber-200">
          Demo Mode Active
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* Power Strategy Card */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-amber-100 p-2 rounded-full">
                <Sun className="h-6 w-6 text-amber-600" />
              </div>
              <CardTitle>Power Strategy</CardTitle>
            </div>
            <CardDescription>Track daily energy consumption and configure solar, batteries, and generators.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full" variant="outline">
              <Link href="/calculators/power">Open Calculator</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Water Calculator Card */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-blue-100 p-2 rounded-full">
                <Droplets className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle>Water Strategy</CardTitle>
            </div>
            <CardDescription>Manage fresh, gray, and black water tanks and usage schedules.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full" variant="outline">
              <Link href="/calculators/water">Open Calculator</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Living Budget Card */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-purple-100 p-2 rounded-full">
                <Wallet className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle>Living Budget</CardTitle>
            </div>
            <CardDescription>Track monthly expenses, fuel, campsite fees, and maintenance.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full" variant="outline">
              <Link href="/calculators/budget">Open Calculator</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Purchase Calculator Card */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-green-100 p-2 rounded-full">
                <Calculator className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>Purchase Planner</CardTitle>
            </div>
            <CardDescription>Calculate loan amortizations, down payments, and total costs.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full" variant="outline">
              <Link href="/calculators/purchase">Open Calculator</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Setup Budget Card */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-emerald-100 p-2 rounded-full">
                <Wallet className="h-6 w-6 text-emerald-600" />
              </div>
              <CardTitle>Setup Budget</CardTitle>
            </div>
            <CardDescription>Track items needed to set up your RV for full-time living.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full" variant="outline">
              <Link href="/calculators/setup">Open Calculator</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Master Plan Report Card */}
        <Card className="hover:shadow-md transition-shadow md:col-span-2 lg:col-span-1 bg-slate-50 border-slate-200">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-slate-200 p-2 rounded-full">
                <FileText className="h-6 w-6 text-slate-700" />
              </div>
              <CardTitle>Master Plan Report</CardTitle>
            </div>
            <CardDescription>Generate a comprehensive PDF export of all your RV planning data.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full bg-slate-800 hover:bg-slate-700 text-white">
              <Link href="/reports/master">Generate Report</Link>
            </Button>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
