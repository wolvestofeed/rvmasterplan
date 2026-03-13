"use client";

import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";

const SESSION_KEY = "rvmp-session-active";

/**
 * Signs the user out when a new browser session starts.
 * Uses sessionStorage (cleared on browser close) to detect fresh sessions.
 */
export function SessionGuard() {
  const { isLoaded, isSignedIn, signOut } = useAuth();

  useEffect(() => {
    if (!isLoaded) return; // Wait for Clerk to finish hydrating

    const hasActiveSession = sessionStorage.getItem(SESSION_KEY);

    if (!hasActiveSession && isSignedIn) {
      // New browser session with a stale Clerk cookie — sign out and redirect home
      signOut({ redirectUrl: "/" });
      return;
    }

    // Mark this browser session as active
    sessionStorage.setItem(SESSION_KEY, "1");
  }, [isLoaded, isSignedIn, signOut]);

  return null;
}
