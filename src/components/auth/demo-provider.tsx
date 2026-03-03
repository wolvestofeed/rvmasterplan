"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

// This is a stub for the real Clerk Auth
// We'll replace this with actual Clerk hooks later

type User = {
    id: string;
    firstName: string;
    lastName: string;
    emailAddresses: { emailAddress: string }[];
};

type AuthContextType = {
    isLoaded: boolean;
    isSignedIn: boolean;
    user: User | null;
    signIn: () => void;
    signOut: () => void;
};

const AuthContext = createContext<AuthContextType>({
    isLoaded: true,
    isSignedIn: false,
    user: null,
    signIn: () => { },
    signOut: () => { },
});

export const useAuthDemo = () => useContext(AuthContext);

export function DemoAuthProvider({ children }: { children: React.ReactNode }) {
    const [isSignedIn, setIsSignedIn] = useState(true); // Default to signed in for demo development

    const demoUser: User = {
        id: "demo_user_123",
        firstName: "Robert",
        lastName: "Bogatin",
        emailAddresses: [{ emailAddress: "demo@wolvesfeed.com" }],
    };

    const signIn = () => setIsSignedIn(true);
    const signOut = () => setIsSignedIn(false);

    return (
        <AuthContext.Provider value={{ isLoaded: true, isSignedIn, user: isSignedIn ? demoUser : null, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}
