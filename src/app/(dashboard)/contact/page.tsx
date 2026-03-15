"use client";

import { useState } from "react";
import { HeaderHero } from "@/components/layout/header-hero";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { submitContactForm } from "@/app/actions/contact";

export default function ContactPage() {
    const { user } = useUser();
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState(user?.fullName || "");
    const [email, setEmail] = useState(user?.primaryEmailAddress?.emailAddress || "");
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const result = await submitContactForm({ name, email, subject, message });

        if (result.success) {
            toast.success("Message sent! We'll get back to you soon.");
            setSubject("");
            setMessage("");
        } else {
            toast.error(result.error || "Something went wrong. Please try again.");
        }

        setLoading(false);
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <HeaderHero
                title="Contact RVMP"
                description=""
                hideOverlay
            />

            <div className="mb-6">
                <h1 className="text-3xl font-bold text-brand-primary tracking-tight">Contact RVMP</h1>
                <p className="text-brand-primary text-sm md:text-base leading-relaxed font-medium mt-2">
                    Have a question, suggestion, or need help? Send us a message and we&apos;ll get back to you.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Send Us a Message</CardTitle>
                    <CardDescription>
                        Fill out the form below and we&apos;ll respond as soon as possible.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Your name"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="your@email.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="subject">Subject</Label>
                            <Input
                                id="subject"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="What's this about?"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="message">Message</Label>
                            <textarea
                                id="message"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Tell us more..."
                                required
                                rows={6}
                                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            />
                        </div>

                        <Button type="submit" disabled={loading} className="w-full md:w-auto">
                            {loading ? "Sending..." : "Send Message"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
