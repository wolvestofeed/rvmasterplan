"use client";

import { useState } from "react";
import { AlertTriangle, X, ArrowRight } from "lucide-react";
import Link from "next/link";

interface SubscriptionBannerProps {
    daysRemaining: number | null;
    planType: string;
}

export function SubscriptionBanner({ daysRemaining, planType }: SubscriptionBannerProps) {
    const [dismissed, setDismissed] = useState(false);

    if (dismissed || daysRemaining === null || daysRemaining > 7) return null;

    const isUrgent = daysRemaining <= 3;
    const isStarter = planType === "starter";

    const bgClass = isUrgent
        ? "bg-red-50 border-red-200 text-red-900"
        : "bg-amber-50 border-amber-200 text-amber-900";
    const iconClass = isUrgent ? "text-red-500" : "text-amber-500";
    const linkClass = isUrgent
        ? "font-semibold underline hover:text-red-700"
        : "font-semibold underline hover:text-amber-700";

    const daysLabel = daysRemaining === 1 ? "1 day" : `${daysRemaining} days`;
    const message = isStarter
        ? `Your Starter Pack expires in ${daysLabel}. Upgrade to Pro to keep full access.`
        : `Your subscription renews in ${daysLabel}.`;

    const ctaLabel = isStarter ? "Upgrade to Pro" : "Manage Subscription";

    return (
        <div className={`w-full border-b px-6 py-2.5 flex items-center justify-between gap-4 text-sm ${bgClass}`}>
            <div className="flex items-center gap-2 min-w-0">
                <AlertTriangle className={`w-4 h-4 shrink-0 ${iconClass}`} />
                <span className="truncate">{message}</span>
                <Link href="/settings" className={linkClass}>
                    {ctaLabel} <ArrowRight className="inline w-3 h-3 ml-0.5" />
                </Link>
            </div>
            <button
                onClick={() => setDismissed(true)}
                className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
                aria-label="Dismiss"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}
