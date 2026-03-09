"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckIcon, ArrowRight, ArrowLeft, BarChart3, Banknote, ClipboardList, Zap, Droplets, Library, Camera } from 'lucide-react';

export default function WelcomePage() {
    const [step, setStep] = useState(1);
    const router = useRouter();

    // Subscription info
    const subscription = {
        name: 'RV MasterPlan Package',
        tier: 'masterplan_member'
    };

    // Features based on the subscription tier
    const features = [
        {
            title: 'Dashboard & Analytics',
            description: 'An overview of your RV systems and metrics',
            icon: <BarChart3 className="w-6 h-6" />
        },
        {
            title: 'RV Purchase Calculator',
            description: 'Plan your RV purchase with detailed financing and budgeting tools',
            icon: <Banknote className="w-6 h-6" />
        },
        {
            title: 'Setup & Living Budgets',
            description: 'Enter your setup and fixed expenses to start planning',
            icon: <ClipboardList className="w-6 h-6" />
        },
        {
            title: 'Energy, Solar & Fuel',
            description: 'Enter your solar system, electrical devices and fuel levels',
            icon: <Zap className="w-6 h-6" />
        },
        {
            title: 'Photo to Expense',
            description: 'phone camera receipts auto-fill for all expenses and capture your gallons of fuel',
            icon: <Camera className="w-6 h-6" />
        },
        {
            title: 'Water Usage Tracking',
            description: 'Monitor your water consumption with intelligent tracking features',
            icon: <Droplets className="w-6 h-6" />
        },
        {
            title: 'Document Library',
            description: 'Store and organize all your RV-related documents in one secure place',
            icon: <Library className="w-6 h-6" />
        }
    ];

    const getStepContent = () => {
        switch (step) {
            case 1:
                return (
                    <Card className="border-primary/20 shadow-xl max-w-4xl mx-auto overflow-hidden">
                        <CardHeader className="text-center bg-primary/5 pb-8 pt-0 px-0 relative min-h-[300px] flex flex-col justify-end">
                            {/* Background Image Header */}
                            <div
                                className="absolute inset-0 z-0 bg-cover bg-center"
                                style={{
                                    backgroundImage: 'url("/images/page-headers/rvmp-welcome-header.jpg")',
                                    filter: 'brightness(0.6)'
                                }}
                            />

                            <div className="relative z-10 p-8 pt-12">
                                <div className="max-w-xs mx-auto mb-6">
                                    <div className="w-20 h-20 bg-primary/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-white/50 shadow-xl">
                                        <CheckIcon className="w-10 h-10 text-white" strokeWidth={3} />
                                    </div>
                                    <CardTitle className="text-4xl font-black mb-2 text-white drop-shadow-md">Welcome!</CardTitle>
                                    <CardDescription className="text-xl text-white/90 font-medium drop-shadow-sm">Your subscription is active</CardDescription>
                                </div>

                                <div className="bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-white/20 max-w-sm mx-auto flex items-center gap-4">
                                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-2xl">
                                        🌟
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-bold text-lg text-foreground">{subscription.name}</h3>
                                        <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">MasterPlan Member</p>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="px-8 py-12">
                            <div className="max-w-3xl mx-auto">
                                <h2 className="text-2xl font-bold mb-10 text-center text-foreground/90">Your new specialized toolkit includes:</h2>

                                <div className="grid md:grid-cols-2 gap-6">
                                    {features.slice(0, 6).map((feature, index) => (
                                        <div key={index} className="flex p-5 border rounded-2xl bg-card hover:border-primary/40 hover:shadow-md transition-all duration-300 group">
                                            <div className="flex-shrink-0 w-12 h-12 bg-primary/5 group-hover:bg-primary/10 rounded-xl flex items-center justify-center mr-4 text-primary transition-colors">
                                                {feature.icon}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg leading-tight mb-1 group-hover:text-primary transition-colors">{feature.title}</h3>
                                                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>

                        <CardFooter className="flex justify-between bg-muted/30 px-8 py-6">
                            <Button
                                variant="ghost"
                                onClick={() => router.push('/dashboard')}
                            >
                                Skip Onboarding
                            </Button>
                            <Button
                                onClick={() => setStep(2)}
                                className="gap-2 px-6"
                            >
                                Continue <ArrowRight className="w-4 h-4" />
                            </Button>
                        </CardFooter>
                    </Card>
                );

            case 2:
                return (
                    <Card className="border-primary/20 shadow-xl max-w-4xl mx-auto overflow-hidden">
                        <CardHeader className="text-center pb-6 pt-10 border-b">
                            <CardTitle className="text-3xl font-bold mb-2">Personalize Your Experience</CardTitle>
                            <CardDescription className="text-lg">Let's set up your RV MasterPlan to match your specific needs</CardDescription>
                        </CardHeader>

                        <CardContent className="px-8 py-10">
                            <div className="max-w-2xl mx-auto space-y-8">
                                <div className="p-6 border rounded-xl bg-blue-50/30 border-blue-100 shadow-sm">
                                    <h3 className="text-xl font-bold mb-4 flex items-center">
                                        <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center mr-3 text-sm font-bold">1</span>
                                        RV Details Setup
                                    </h3>
                                    <p className="text-muted-foreground mb-6">Enter your RV information to enable personalized calculations and tracking</p>
                                    <ul className="space-y-3">
                                        <li className="flex items-start">
                                            <div className="bg-green-100 p-0.5 rounded-full mr-3 mt-0.5">
                                                <CheckIcon className="h-4 w-4 text-green-600" />
                                            </div>
                                            <span className="text-foreground/80">RV make, model, and year</span>
                                        </li>
                                        <li className="flex items-start">
                                            <div className="bg-green-100 p-0.5 rounded-full mr-3 mt-0.5">
                                                <CheckIcon className="h-4 w-4 text-green-600" />
                                            </div>
                                            <span className="text-foreground/80">Tank capacities and dimensions</span>
                                        </li>
                                        <li className="flex items-start">
                                            <div className="bg-green-100 p-0.5 rounded-full mr-3 mt-0.5">
                                                <CheckIcon className="h-4 w-4 text-green-600" />
                                            </div>
                                            <span className="text-foreground/80">Weight specifications and limits</span>
                                        </li>
                                    </ul>
                                </div>

                                <div className="p-6 border rounded-xl bg-emerald-50/30 border-emerald-100 shadow-sm">
                                    <h3 className="text-xl font-bold mb-4 flex items-center">
                                        <span className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center mr-3 text-sm font-bold">2</span>
                                        Energy System Configuration
                                    </h3>
                                    <p className="text-muted-foreground mb-6">Configure your solar and battery setup for accurate energy calculations</p>
                                    <ul className="space-y-3">
                                        <li className="flex items-start">
                                            <div className="bg-green-100 p-0.5 rounded-full mr-3 mt-0.5">
                                                <CheckIcon className="h-4 w-4 text-green-600" />
                                            </div>
                                            <span className="text-foreground/80">Solar panel specifications</span>
                                        </li>
                                        <li className="flex items-start">
                                            <div className="bg-green-100 p-0.5 rounded-full mr-3 mt-0.5">
                                                <CheckIcon className="h-4 w-4 text-green-600" />
                                            </div>
                                            <span className="text-foreground/80">Battery capacity and configuration</span>
                                        </li>
                                        <li className="flex items-start">
                                            <div className="bg-green-100 p-0.5 rounded-full mr-3 mt-0.5">
                                                <CheckIcon className="h-4 w-4 text-green-600" />
                                            </div>
                                            <span className="text-foreground/80">Power consumption tracking</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </CardContent>

                        <CardFooter className="flex justify-between bg-muted/30 px-8 py-6">
                            <Button
                                variant="outline"
                                onClick={() => setStep(1)}
                                className="gap-2"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back
                            </Button>
                            <Button
                                onClick={() => router.push('/dashboard')}
                                className="gap-2 px-6"
                            >
                                Go to Dashboard <ArrowRight className="w-4 h-4" />
                            </Button>
                        </CardFooter>
                    </Card>
                );

            default:
                return null;
        }
    };

    return (
        <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center p-4">
            <div className="w-full">
                {getStepContent()}
            </div>
        </div>
    );
}
