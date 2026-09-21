"use client";

import { usePathname } from "next/navigation";

/** Routes that need the full content width (wide tables). */
const WIDE_ROUTES = ["/calculators/cashflow"];

/** Wraps dashboard page content. Most pages get the standard max-w-6xl column;
 *  wide routes (the 12-month cash flow grid) get the whole main area. */
export function ContentContainer({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isWide = WIDE_ROUTES.some(r => pathname === r || pathname.startsWith(r + "/"));
    return (
        <div className={isWide ? "w-full min-w-0 px-6 pb-12" : "max-w-6xl mx-auto pb-12"}>
            {children}
        </div>
    );
}
