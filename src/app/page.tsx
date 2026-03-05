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

                {/* Hero Overlay Content */}
                <div className="relative z-10 text-center px-4 max-w-4xl mx-auto mt-16">
                    <h1 className="text-5xl md:text-7xl font-bold text-white mb-32 drop-shadow-lg tracking-tight">
                        Your Blueprint<br />for the Open Road.
                    </h1>
                    <p className="text-xl md:text-2xl text-slate-200 mb-10 drop-shadow-md">
                        The ultimate toolkit to plan, budget, and optimize your full-time RV lifestyle. From solar arrays to water conservation.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button asChild size="lg" className="bg-[#8ca163] hover:bg-[#7a8e52] text-white text-lg px-8 py-6 rounded-full shadow-lg">
                            <Link href="/free-trial">Full Free Trial</Link>
                        </Button>
                        <SignedOut>
                            <SignUpButton mode="modal">
                                <Button size="lg" className="bg-[#2a4f3f] hover:bg-[#1a3a2d] text-white text-lg px-8 py-6 rounded-full shadow-lg">
                                    Subscribe Now
                                </Button>
                            </SignUpButton>
                        </SignedOut>
                        <Button asChild size="lg" variant="outline" className="bg-transparent border-2 border-white text-white hover:bg-white/20 text-lg px-8 py-6 rounded-full shadow-lg">
                            <Link href="/dashboard">Guest Demo Mode</Link>
                        </Button>
                    </div>
                </div>
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

            {/* Narrative Section */}
            <section className="py-16 px-6 max-w-4xl mx-auto text-center border-t border-slate-200 mt-8">
                <h2 className="text-3xl font-bold text-[#2a4f3f] mb-6">Designed For the Serious Nomads</h2>
                <p className="text-lg text-slate-600 leading-relaxed mb-8">
                    The RV MasterPlan is designed around a core philosophy: knowing your numbers means knowing your freedom.
                    Whether you are boondocking for weeks in the desert or navigating the complexities of financing a new rig,
                    these calculators adapt to your exact equipment limits and living expenses so you never run out of power, water, or runway.
                </p>
            </section>

            {/* Pricing / Demo Explanation */}
            <section className="py-20 bg-[#f1f6ea] px-6">
                <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12">

                    <div className="bg-white p-10 rounded-2xl shadow-sm border border-[#e0e8d5]">
                        <h3 className="text-2xl font-bold text-slate-800 mb-4 tracking-tight">Guest Mode</h3>
                        <p className="text-slate-600 mb-6">
                            Get an immediate feel for the calculators. Guest Mode comes pre-loaded with mock data so you can test sliding the tank limits, tweaking the solar array, and generating an example Master Plan PDF.
                        </p>
                        <ul className="space-y-3 text-sm text-slate-600 border-t pt-6 mb-8">
                            <li className="flex items-center">✓ Access all calculators</li>
                            <li className="flex items-center">✓ Generate PDF reports</li>
                            <li className="flex items-center text-amber-600 font-medium">⚠️ Data resets when you leave</li>
                        </ul>
                        <Button asChild variant="outline" className="w-full">
                            <Link href="/dashboard">Try Guest Mode</Link>
                        </Button>
                    </div>

                    <div className="bg-[#2a4f3f] text-white p-10 rounded-2xl shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Image src="/images/logos/rv-masterplan-logo.png" width={150} height={150} alt="Background Logo" />
                        </div>
                        <h3 className="text-2xl font-bold mb-4 tracking-tight relative z-10">Pro Subscription</h3>
                        <p className="text-slate-300 mb-6 relative z-10">
                            Save your exact RV loadout in the cloud. We securely save your solar panel wattage, tank capacities, and daily living budget. Log in from any device to update your strategy real-time.
                        </p>
                        <ul className="space-y-3 text-sm text-slate-200 border-t border-white/20 pt-6 mb-8 relative z-10">
                            <li className="flex items-center">✓ Custom equipment database</li>
                            <li className="flex items-center">✓ Saved historical budgets</li>
                            <li className="flex items-center">✓ Secure cloud synchronization</li>
                        </ul>
                        <SignedOut>
                            <SignUpButton mode="modal">
                                <Button className="w-full bg-[#8ca163] hover:bg-[#7a8e52] text-white border-0 relative z-10">Subscribe $5/mo</Button>
                            </SignUpButton>
                        </SignedOut>
                        <SignedIn>
                            <Button disabled variant="outline" className="w-full relative z-10">Currently Subscribed</Button>
                        </SignedIn>
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
