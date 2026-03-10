"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { SignInButton, SignUpButton, SignedOut, SignedIn } from "@clerk/nextjs";

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-white">
            {/* Header - Buttons Only */}
            <header className="absolute top-0 right-0 z-50 p-6 flex justify-end items-center">
                <div className="space-x-4">
                    <SignedOut>
                        <SignInButton mode="modal">
                            <Button variant="outline" className="bg-white/80 backdrop-blur border-white/40 text-slate-800 hover:bg-white">Log In</Button>
                        </SignInButton>
                        <Button asChild className="bg-[#8ca163] hover:bg-[#7a8e52] text-white">
                            <Link href="/free-trial">Free Trial</Link>
                        </Button>
                        <SignUpButton mode="modal">
                            <Button className="bg-[#2a4f3f] hover:bg-[#1a3a2d] text-white">Subscribe Now</Button>
                        </SignUpButton>
                    </SignedOut>
                    <SignedIn>
                        <Button asChild className="bg-[#2a4f3f] hover:bg-[#1a3a2d] text-white">
                            <Link href="/dashboard">Go to Dashboard</Link>
                        </Button>
                    </SignedIn>
                </div>
            </header>

            {/* Static Image Hero Section */}
            <section className="relative w-full h-[70vh] min-h-[500px] flex items-center justify-center overflow-hidden bg-slate-900">
                <Image
                    src="/images/page-headers/home-hero-header.jpg"
                    alt="RV MasterPlan Hero"
                    fill
                    className="object-cover opacity-60"
                    priority
                />

                {/* Logo in top left */}
                <div className="absolute top-6 left-6 z-20">
                    <div className="bg-white p-3 rounded-xl shadow-lg inline-flex items-center justify-center">
                        <Image
                            src="/images/logos/rv-masterplan-logo-landscape.png"
                            alt="RV MasterPlan Logo"
                            width={160}
                            height={53}
                            className="object-contain"
                        />
                    </div>
                </div>

                <div className="relative z-10 text-center px-4 max-w-4xl mx-auto pt-32">
                    <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 drop-shadow-lg tracking-tight">
                        Master Your RV Money & Resources,<br />Maximize Your Freedom
                    </h1>
                    <p className="text-xl md:text-2xl text-slate-200 drop-shadow-md">
                        Off-grid life management . . . all in one place.
                    </p>
                </div>
            </section>

            {/* Video Introduction Section */}
            {/* Narrative Section */}
            <section className="py-16 px-6 max-w-4xl mx-auto text-center">
                <h2 className="text-3xl font-bold text-[#2a4f3f] mb-6">The Ultimate Toolkit for Every Road Warrior</h2>
                <p className="text-lg text-slate-600 leading-relaxed">
                    RV MasterPlan is for money and resource management, with a complete toolkit of calculators and trackers to forecast your RV loan payments and setup costs, to create the perfect solar and energy system and to manage your budgets, water, energy, fuel, weight and waste... all in one place.
                </p>
            </section>

            {/* Video Introduction Section */}
            <section className="bg-[#f8fbf5] py-20 px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-12 mb-12">
                        <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-xl border-4 border-white">
                            <Image
                                src="/images/rv-photos/jrb-grand-canyon-24.jpg"
                                alt="Rob Bogatin"
                                fill
                                className="object-cover"
                            />
                        </div>
                        <div className="text-center md:text-left">
                            <h2 className="text-3xl font-bold text-[#2a4f3f] mb-4">Meet Your Support Team</h2>
                            <p className="text-lg text-slate-600">
                                Hey there! Thank you for checking out RV MasterPlan. I&apos;ve spent a lot of time in the backcountry and I love visiting America&apos;s most iconic, geographic and culturally rich destinations. I built this App for myself when I moved into a travel trailer
                                last Spring. It&apos;s really helpful, so I thought you might like it too! Rob
                            </p>
                        </div>
                    </div>

                    <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl border-4 border-white bg-black">
                        <video
                            playsInline
                            controls
                            preload="metadata"
                            className="w-full h-full object-contain"
                        >
                            <source src="/videos/intro.mp4" type="video/mp4" />
                            Your browser does not support the video tag.
                        </video>
                    </div>
                </div>
            </section>

            {/* Pricing / Demo Explanation */}
            <section className="py-20 bg-[#f1f6ea] px-6">
                <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-8 items-stretch">

                    {/* Guest Mode */}
                    <div className="bg-white rounded-2xl shadow-sm border border-[#e0e8d5] flex flex-col h-full overflow-hidden">
                        <Link href="/dashboard" className="w-full relative h-[320px] block cursor-pointer hover:opacity-90 transition-opacity">
                            <Image
                                src="/images/thumbs/rvmp-home-demo-header2-web.jpg"
                                alt="Guest Mode Demo"
                                fill
                                className="object-contain"
                                priority
                            />
                        </Link>

                        <div className="p-8 flex flex-col flex-grow">
                            <h3 className="text-xl font-bold text-slate-800 mb-3 tracking-tight">Full Demo Mode</h3>
                            <p className="text-black mb-6 text-sm flex-grow">
                                Explore the full potential of RV MasterPlan's resource management suite with a pre-loaded rig and setup data. Experience how our calculators forecast setup costs and optimize off-grid resources before you start your own plan.
                            </p>
                            <ul className="space-y-2 text-sm text-slate-600 border-t pt-4 mb-6">
                                <li className="flex items-center text-black font-medium">✓ Full access to all calculators</li>
                                <li className="flex items-center text-black font-medium">✓ Pre-loaded RV MasterPlan data</li>
                                <li className="flex items-center text-black font-medium">⚠️ Data resets when session ends</li>
                            </ul>
                            <div className="mt-auto">
                                <Button asChild variant="outline" className="w-full">
                                    <Link href="/dashboard">Try Guest Mode</Link>
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Starter Pack - One Time Purchase */}
                    <div className="bg-[#4a90e2] text-white rounded-2xl shadow-xl relative overflow-hidden flex flex-col h-full border border-blue-400">
                        <div className="w-full relative aspect-video bg-white cursor-pointer hover:opacity-90 transition-opacity" onClick={async () => {
                            const { createCheckoutSession } = await import('@/app/actions/stripe');
                            try {
                                const { url } = await createCheckoutSession('prod_U761gS5q8ey7b7', null, 2000);
                                window.location.href = url;
                            } catch (e: unknown) {
                                const error = e as Error;
                                alert(error.message);
                            }
                        }}>
                            <Image
                                src="/images/thumbs/rvmp-starter-bundle-thumb.jpg"
                                alt="Starter Pack"
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>

                        <div className="p-8 flex flex-col flex-grow">
                            <h3 className="text-xl font-bold mb-3 tracking-tight text-white">Starter Pack $20</h3>
                            <p className="text-white mb-6 text-sm flex-grow">
                                Perfect for the "setting up" phase. Get 3 months of one-time access to build your RV MasterPlan: forecast your energy demands and build your solar array, optimize your water and devices, plan your budgets, and more before you hit the road.
                            </p>
                            <ul className="space-y-2 text-sm text-blue-100 border-t border-white/20 pt-4 mb-6">
                                <li className="flex items-center text-white font-medium">✓ 3 Months limited App access</li>
                                <li className="flex items-center text-white font-medium">✓ Full Access to Setup and Build features</li>
                                <li className="flex items-center text-white font-medium">✓ No recurring billing</li>
                            </ul>
                            <div className="mt-auto">
                                <SignedOut>
                                    <SignUpButton mode="modal">
                                        <Button className="w-full bg-[#8ca163] hover:bg-[#7a8e52] text-white">Sign Up to Buy</Button>
                                    </SignUpButton>
                                </SignedOut>
                                <SignedIn>
                                    <Button
                                        className="w-full bg-[#8ca163] hover:bg-[#7a8e52] text-white"
                                        onClick={async () => {
                                            const { createCheckoutSession } = await import('@/app/actions/stripe');
                                            try {
                                                const { url } = await createCheckoutSession('prod_U761gS5q8ey7b7', null, 2000);
                                                window.location.href = url;
                                            } catch (e: unknown) {
                                                const error = e as Error;
                                                alert(error.message);
                                            }
                                        }}
                                    >Buy Now $20</Button>
                                </SignedIn>
                            </div>
                        </div>
                    </div>

                    {/* Pro Monthly Subscription */}
                    <div className="bg-[#2a4f3f] text-white rounded-2xl shadow-xl relative overflow-hidden flex flex-col h-full ring-2 ring-[#8ca163]">
                        {/* New Uploaded Image as Banner */}
                        <div className="w-full relative h-[320px] bg-white cursor-pointer hover:opacity-90 transition-opacity" onClick={async () => {
                            const { createCheckoutSession } = await import('@/app/actions/stripe');
                            try {
                                const { url } = await createCheckoutSession('prod_U5dlLuufA1MNDN', 'month', 1000);
                                window.location.href = url;
                            } catch (e: unknown) {
                                const error = e as Error;
                                alert(error.message);
                            }
                        }}>
                            <Image
                                src="/images/thumbs/rvmp-home-monthly-header2-web.jpg"
                                alt="Full App Subscription $10 Monthly"
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>

                        <div className="p-8 flex flex-col flex-grow">
                            <h3 className="text-xl font-bold mb-3 tracking-tight relative z-10 text-white">Monthly Pro $10/mo</h3>
                            <p className="text-white mb-6 relative z-10 text-sm flex-grow">
                                Take command of your financial and physical freedom. Forecast loan payments, manage monthly budgets, and track every resource - energy, water, fuel, waste, and weight — with a custom cloud database built for your exact equipment and lifestyle needs.
                            </p>
                            <ul className="space-y-2 text-sm text-slate-200 border-t border-white/20 pt-4 mb-6 relative z-10">
                                <li className="flex items-center text-white font-medium">✓ Photo to Expense Capture</li>
                                <li className="flex items-center text-white font-medium">✓ Advanced water, power & weight tracking</li>
                                <li className="flex items-center text-white font-medium">✓ Complete financial & budget planning</li>
                            </ul>

                            <div className="mt-auto space-y-3">
                                <SignedOut>
                                    <SignUpButton mode="modal">
                                        <Button className="w-full bg-[#8ca163] hover:bg-[#7a8e52] text-white border-0 z-10">Sign Up First</Button>
                                    </SignUpButton>
                                </SignedOut>
                                <SignedIn>
                                    <Button
                                        className="w-full bg-[#8ca163] hover:bg-[#7a8e52] text-white border-0 z-10"
                                        onClick={async () => {
                                            const { createCheckoutSession } = await import('@/app/actions/stripe');
                                            try {
                                                const { url } = await createCheckoutSession('prod_U5dlLuufA1MNDN', 'month', 1000);
                                                window.location.href = url;
                                            } catch (e: unknown) {
                                                const error = e as Error;
                                                alert(error.message);
                                            }
                                        }}
                                    >Subscribe $10/mo</Button>
                                </SignedIn>
                            </div>
                        </div>
                    </div>

                    {/* Pro Annual Subscription */}
                    <div className="bg-slate-800 text-white rounded-2xl shadow-xl relative overflow-hidden flex flex-col h-full opacity-90 border border-slate-700">
                        {/* Uploaded Annual Image as Banner */}
                        <div className="w-full relative h-[320px] bg-white cursor-pointer hover:opacity-90 transition-opacity" onClick={async () => {
                            const { createCheckoutSession } = await import('@/app/actions/stripe');
                            try {
                                const { url } = await createCheckoutSession('prod_U5eAx39CeZ5HmH', 'year', 6000);
                                window.location.href = url;
                            } catch (e: unknown) {
                                const error = e as Error;
                                alert(error.message);
                            }
                        }}>
                            <Image
                                src="/images/thumbs/rvmp-home-annual2-header-web.jpg"
                                alt="Full App Subscription $60 Annually"
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>

                        <div className="p-8 flex flex-col flex-grow">
                            <h3 className="text-xl font-bold mb-3 tracking-tight relative z-10 text-white">Annual Pro $60/yr</h3>
                            <p className="text-white mb-6 relative z-10 text-sm flex-grow">
                                The complete RV life management App for long-term confidence on the road. Optimize every component of your adventure - from seasonal solar power strategies to secure document management — with all your off - grid resource and money management tools in one place.
                            </p>
                            <ul className="space-y-2 text-sm text-slate-200 border-t border-white/20 pt-4 mb-6 relative z-10">
                                <li className="flex items-center text-white font-medium">✓ Expanded storage for photos and documents</li>
                                <li className="flex items-center text-white font-medium">✓ Photo to Expense Capture</li>
                                <li className="flex items-center text-white font-medium">✓ 50% discount on Monthly Pro</li>
                            </ul>

                            <div className="mt-auto space-y-3">
                                <SignedOut>
                                    <SignUpButton mode="modal">
                                        <Button className="w-full bg-[#8ca163] hover:bg-[#7a8e52] text-white border-0 z-10">Sign Up First</Button>
                                    </SignUpButton>
                                </SignedOut>
                                <SignedIn>
                                    <Button
                                        className="w-full bg-[#8ca163] hover:bg-[#7a8e52] text-white border-0 z-10"
                                        onClick={async () => {
                                            const { createCheckoutSession } = await import('@/app/actions/stripe');
                                            try {
                                                const { url } = await createCheckoutSession('prod_U5eAx39CeZ5HmH', 'year', 6000);
                                                window.location.href = url;
                                            } catch (e: unknown) {
                                                const error = e as Error;
                                                alert(error.message);
                                            }
                                        }}
                                    >Subscribe $60/yr</Button>
                                </SignedIn>
                            </div>
                        </div>
                    </div>

                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-900 border-t border-slate-800 py-12 px-6">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center opacity-80 gap-6">
                    <Image
                        src="/images/logos/rv-masterplan-logo-landscape.png"
                        alt="RV MasterPlan Logo"
                        width={180}
                        height={60}
                        className="object-contain filter brightness-0 invert"
                    />
                    <div className="text-slate-400 text-sm text-center md:text-left">
                        © {new Date().getFullYear()} Wolves to Feed Publishing<br />
                        All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
}
