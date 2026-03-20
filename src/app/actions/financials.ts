"use server";

import { db } from "@/lib/db";
import { financialData, rvVehicles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { getActiveUserId, getRvId } from "@/lib/actions/auth-helpers";
import { getCachedDemoRVVehicle, getCachedDemoFinancialData } from "@/lib/actions/demo-cache";

export async function getRVVehicle() {
    try {
        const activeId = await getActiveUserId();
        if (activeId === "demo_user" || activeId.startsWith("guest_")) return getCachedDemoRVVehicle();

        const rv = await db.query.rvVehicles.findFirst({
            where: eq(rvVehicles.userId, activeId)
        });

        if (!rv) return { success: false, error: "RV Profile not found" };
        return { success: true, data: rv };
    } catch (error) {
        return { success: false, error: "Failed to fetch RV vehicle data" };
    }
}

export async function getFinancialData() {
    try {
        const { rvId, isDemo } = await getRvId();
        if (isDemo) return getCachedDemoFinancialData();
        if (!rvId) return { success: false, error: "RV Profile not found" };

        const data = await db.query.financialData.findFirst({
            where: eq(financialData.rvId, rvId)
        });

        return { success: true, data };
    } catch (error) {
        return { success: false, error: "Failed to fetch financial data" };
    }
}

export async function updateFinancialData(values: any) {
    try {
        const { rvId, isDemo } = await getRvId();
        if (isDemo) return { error: "Guest Mode is Read-Only! Cannot save calculations." };
        if (!rvId) return { error: "RV Profile not found" };

        const numValues = {
            purchasePrice: values.purchasePrice?.toString(),
            salesTaxRate: values.salesTaxRate?.toString(),
            downPayment: values.downPayment?.toString(),
            tradeInValue: values.tradeInValue?.toString(),
            loanTermYears: parseInt(values.loanTerm || values.loanTermYears || '5'),
            interestRate: values.interestRate?.toString(),
            creditScore: values.creditScore,
            registrationFees: values.registrationFees?.toString(),
            insurance: values.insurance?.toString(),
            extendedWarranty: values.extendedWarranty?.toString(),
            accessories: values.accessories?.toString()
        };

        await db.insert(financialData)
            .values({
                id: randomUUID(),
                rvId,
                ...numValues
            })
            .onConflictDoUpdate({
                target: financialData.rvId,
                set: { ...numValues, updatedAt: new Date() },
            });
        revalidatePath('/calculators/purchase');
        return { success: true };
    } catch (error: any) {
        return { error: error.message || "Failed to save financial data" };
    }
}
