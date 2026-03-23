import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RV MasterPlan | Money & Resource Management for Nomads",
  description: "The all-in-one resource management toolkit for RV living. Forecast loan payments, manage budgets, and track energy, water, waste, and weight.",
  keywords: ["RV financial planning", "RV resource management", "boondocking calculators", "RV solar tracker", "RV budget planner", "RV weight management", "nomad life toolkit"],
};

import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { DemoAuthProvider } from "@/components/auth/demo-provider";
import { ClerkProvider } from "@clerk/nextjs";
import { SessionGuard } from "@/components/auth/session-guard";
import Script from "next/script";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="bg-[#f8fbf5]">
        <head>
          <Script
            src="https://www.googletagmanager.com/gtag/js?id=G-ENG486BQ41"
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-ENG486BQ41');
            `}
          </Script>
        </head>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#f8fbf5]`}
        >
          <SessionGuard />
          <DemoAuthProvider>
            <TooltipProvider>
              {children}
              <Toaster />
            </TooltipProvider>
          </DemoAuthProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
