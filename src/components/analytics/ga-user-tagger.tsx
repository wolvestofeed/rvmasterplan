"use client";

import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Sets a GA4 user property `user_type` so analytics can distinguish
 * between authenticated subscribers, demo/guest visitors, and anonymous visitors.
 */
export function GaUserTagger() {
  const { isLoaded, isSignedIn, userId } = useAuth();

  useEffect(() => {
    if (!isLoaded || !window.gtag) return;

    let userType: string;

    if (isSignedIn && userId) {
      userType = "subscriber";
    } else {
      userType = "guest";
    }

    window.gtag("set", "user_properties", { user_type: userType });
  }, [isLoaded, isSignedIn, userId]);

  return null;
}
