"use client";

import { useState } from "react";
import { useSignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { HeaderHero } from "@/components/layout/header-hero";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Link from "next/link";
import { Key, Mail, Lock, CheckCircle2, Loader2 } from "lucide-react";

export default function FreeTrialPage() {
    const { isLoaded, signUp, setActive } = useSignUp();
    const router = useRouter();

    const [emailAddress, setEmailAddress] = useState("");
    const [password, setPassword] = useState("");
    const [accessCode, setAccessCode] = useState("");
    const [pendingVerification, setPendingVerification] = useState(false);
    const [code, setCode] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Form Submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isLoaded) return;
        if (!accessCode.trim()) {
            toast.error("A Trial Code is required to create a free account.");
            return;
        }

        setIsLoading(true);

        try {
            await signUp.create({
                emailAddress,
                password,
                unsafeMetadata: {
                    accessCode: accessCode.trim()
                }
            });

            // Send standard Clerk email verification
            await signUp.prepareEmailAddressVerification({ strategy: "email_code" });

            setPendingVerification(true);
            toast.success("Verification code sent to your email!");

        } catch (err: any) {
            console.error(err);
            toast.error(err.errors?.[0]?.message || "There was an error creating your account.");
        } finally {
            setIsLoading(false);
        }
    };

    // Verification Submit
    const onPressVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isLoaded) return;

        setIsLoading(true);

        try {
            const completeSignUp = await signUp.attemptEmailAddressVerification({
                code,
            });

            if (completeSignUp.status !== 'complete') {
                console.log(JSON.stringify(completeSignUp, null, 2));
                toast.error("Unable to complete verification. Please try again.");
            } else {
                if (setActive) {
                    await setActive({ session: completeSignUp.createdSessionId });
                    toast.success("Welcome aboard! Trial activated.");
                    router.push("/dashboard");
                }
            }
        } catch (err: any) {
            console.error(err);
            toast.error(err.errors?.[0]?.message || "Invalid verification code.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fbf5] flex flex-col">
            <HeaderHero
                title="Start Your Journey"
                description="Use your Trial Code to unlock your fully personalized 30-day Free Trial of the RV MasterPlan."
                imageUrl="/images/page-headers/landing-header.jpg"
                imageClass="opacity-20 bg-[#2a4f3f]"
            />

            <div className="flex-1 flex items-center justify-center p-6 -mt-20 z-10">
                <Card className="w-full max-w-md shadow-2xl border-t-4 border-t-[#8ca163] bg-white">
                    <CardHeader className="text-center pb-4">
                        <CardTitle className="text-2xl font-bold text-[#2a4f3f]">Free Trial Sign Up</CardTitle>
                        <CardDescription>
                            Create your cloud account. Your data will be saved securely across all devices.
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        {!pendingVerification ? (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="nomad@example.com"
                                            value={emailAddress}
                                            onChange={(e) => setEmailAddress(e.target.value)}
                                            required
                                            className="pl-10"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                        <Input
                                            id="password"
                                            type="password"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            className="pl-10"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2 pt-2 border-t mt-4 border-slate-100">
                                    <Label htmlFor="code" className="text-[#8ca163] font-semibold flex items-center gap-2">
                                        <Key className="w-4 h-4" /> Trial Registration Code
                                    </Label>
                                    <Input
                                        id="code"
                                        type="text"
                                        placeholder="Enter VIP Code..."
                                        value={accessCode}
                                        onChange={(e) => setAccessCode(e.target.value)}
                                        required
                                        className="bg-[#f8fbf5] border-[#8ca163]/30 focus-visible:ring-[#8ca163]"
                                    />
                                    <p className="text-xs text-slate-500">
                                        You must have a Trial Code to create a free account. Otherwise, sign up <Link href="/" className="underline hover:text-[#2a4f3f]">here</Link>.
                                    </p>
                                </div>

                                <Button
                                    className="w-full bg-[#8ca163] hover:bg-[#7a8e52] text-white mt-6"
                                    type="submit"
                                    disabled={isLoading}
                                >
                                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify Code & Continue"}
                                </Button>

                                <div className="text-center pt-4 text-sm text-slate-500">
                                    Already have an account? <Link href="/" className="font-medium text-[#2a4f3f] hover:underline">Log in</Link>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={onPressVerify} className="space-y-4">
                                <div className="flex flex-col items-center justify-center p-4">
                                    <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                                        <CheckCircle2 className="w-6 h-6" />
                                    </div>
                                    <h3 className="font-semibold text-lg text-slate-800">Check your email</h3>
                                    <p className="text-sm text-slate-500 text-center mt-2">
                                        We sent a verification code to <span className="font-medium">{emailAddress}</span>
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="verification_code">Verification Code</Label>
                                    <Input
                                        id="verification_code"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                        placeholder="Enter the 6-digit code"
                                        className="text-center tracking-widest text-lg font-mono"
                                        maxLength={6}
                                        required
                                    />
                                </div>

                                <Button
                                    className="w-full bg-[#2a4f3f] hover:bg-[#1a3a2d] text-white mt-4"
                                    type="submit"
                                    disabled={isLoading}
                                >
                                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Activate Dashboard"}
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
