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
                    src="/images/page-headers/landing-header.jpg"
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

                <div className="relative z-10 text-center px-4 max-w-4xl mx-auto mt-16">
                    <h1 className="text-5xl md:text-7xl font-bold text-white mb-32 drop-shadow-lg tracking-tight">
                        Master Your Money & Resources<br />on the Open Road
                    </h1>
                    <h2 className="text-3xl md:text-4xl font-semibold text-slate-100 mb-10 drop-shadow-md">
                        All In One Place.
                    </h2>
                </div>
            </section>

            {/* Video Introduction Section */}
            {/* Narrative Section */}
            <section className="py-16 px-6 max-w-4xl mx-auto text-center">
                <h2 className="text-3xl font-bold text-[#2a4f3f] mb-6">The Ultimate Toolkit for Every Road Warrior</h2>
                <p className="text-lg text-slate-600 leading-relaxed">
                    RV MasterPlan is for money and resource management, with a complete toolkit of calculators and trackers to forecast your RV loan payments and setup costs, to create the perfect solar system and manage your budget, water, energy, RV weight and waste... all in one place.
                </p>
            </section>

            {/* Video Introduction Section */}
            <section className="bg-[#f8fbf5] py-20 px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-bold text-[#2a4f3f] mb-4">Meet Your Guide &sim; Rob</h2>
                        <p className="text-lg text-slate-600">
                            I built this for myself when I moved into a travel trailer last Spring.<br />
                            It's really helpful, so I thought you might like it too!
                        </p>
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
                <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8 items-stretch">

                    {/* Guest Mode */}
                    <div className="bg-white rounded-2xl shadow-sm border border-[#e0e8d5] flex flex-col h-full overflow-hidden">
                        <Link href="/dashboard" className="w-full relative h-[320px] block cursor-pointer hover:opacity-90 transition-opacity">
                            <Image
                                src="/images/thumbs/rvmp-demo-thumb-web-1.jpg"
                                alt="Guest Mode Demo"
                                fill
                                className="object-cover object-top"
                                priority
                            />
                        </Link>

                        <div className="p-8 flex flex-col flex-grow">
                            <h3 className="text-xl font-bold text-slate-800 mb-3 tracking-tight">Guest Demo</h3>
                            <p className="text-slate-600 mb-6 text-sm flex-grow">
                                Explore the full potential of our resource management suite with a pre-loaded rig. Experience how our calculators forecast setup costs and optimize off-grid resources like solar and water before you start your own plan.
                            </p>
                            <ul className="space-y-2 text-sm text-slate-600 border-t pt-4 mb-6">
                                <li className="flex items-center">✓ Full access to all calculators</li>
                                <li className="flex items-center text-amber-600 font-medium">⚠️ Data resets when session ends</li>
                            </ul>
                            <div className="mt-auto">
                                <Button asChild variant="outline" className="w-full">
                                    <Link href="/dashboard">Try Guest Mode</Link>
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Pro Monthly Subscription */}
                    <div className="bg-[#2a4f3f] text-white rounded-2xl shadow-xl relative overflow-hidden flex flex-col h-full ring-2 ring-[#8ca163]">
                        {/* New Uploaded Image as Banner */}
                        <div className="w-full relative h-[320px] bg-white cursor-pointer hover:opacity-90 transition-opacity" onClick={async () => {
                            const { createCheckoutSession } = await import('@/app/actions/stripe');
                            try {
                                const { url } = await createCheckoutSession('prod_U5dlLuufA1MNDN', 'month', 500);
                                window.location.href = url;
                            } catch (e: any) { alert(e.message); }
                        }}>
                            <Image
                                src="/images/thumbs/rvmp-monthly-sub-thumb-web-1.jpg"
                                alt="Full App Subscription $5 Monthly"
                                fill
                                className="object-fill"
                                priority
                            />
                        </div>

                        <div className="p-8 flex flex-col flex-grow">
                            <h3 className="text-xl font-bold mb-3 tracking-tight relative z-10 text-white">Monthly Pro</h3>
                            <p className="text-slate-300 mb-6 relative z-10 text-sm flex-grow">
                                Take command of your financial and physical freedom. Forecast loan payments, manage monthly budgets, and track every resource—energy, water, waste, and weight—with a custom cloud database built for your exact equipment.
                            </p>
                            <ul className="space-y-2 text-sm text-slate-200 border-t border-white/20 pt-4 mb-6 relative z-10">
                                <li className="flex items-center">✓ Custom equipment & solar database</li>
                                <li className="flex items-center">✓ Advanced water, power & weight tracking</li>
                                <li className="flex items-center">✓ Complete financial & budget planning</li>
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
                                                const { url } = await createCheckoutSession('prod_U5dlLuufA1MNDN', 'month', 500);
                                                window.location.href = url;
                                            } catch (e: any) { alert(e.message); }
                                        }}
                                    >Subscribe $5/mo</Button>
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
                                const { url } = await createCheckoutSession('prod_U5eAx39CeZ5HmH', 'year', 5000);
                                window.location.href = url;
                            } catch (e: any) { alert(e.message); }
                        }}>
                            <Image
                                src="/images/thumbs/rvmp-annual-sub-thumb-web-1.jpg"
                                alt="Full App Subscription $50 Annually"
                                fill
                                className="object-cover object-top"
                                priority
                            />
                        </div>

                        <div className="p-8 flex flex-col flex-grow">
                            <h3 className="text-xl font-bold mb-3 tracking-tight relative z-10 text-white">Annual Pro</h3>
                            <p className="text-slate-300 mb-6 relative z-10 text-sm flex-grow">
                                The complete toolkit for long-term road confidence. Optimize every component of your journey—from seasonal power strategies to secure document management—with all your resource and money-management tools in one place.
                            </p>
                            <ul className="space-y-2 text-sm text-slate-200 border-t border-white/20 pt-4 mb-6 relative z-10">
                                <li className="flex items-center">✓ Everything in Monthly Pro</li>
                                <li className="flex items-center">✓ Secure document & manual vault</li>
                                <li className="flex items-center text-[#8ca163]">✓ Get 2 months completely free</li>
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
                                                const { url } = await createCheckoutSession('prod_U5eAx39CeZ5HmH', 'year', 5000);
                                                window.location.href = url;
                                            } catch (e: any) { alert(e.message); }
                                        }}
                                    >Subscribe $50/yr</Button>
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
                        © {new Date().getFullYear()} Robert Bogatin. The Wolves to Feed.<br />
                        All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
}
