"use server";

import { db } from "@/lib/db";
import { financialData, rvVehicles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function getFinancialData() {
    try {
        const { userId } = await auth();
        const activeId = userId || "demo_user";

        const rv = await db.query.rvVehicles.findFirst({
            where: eq(rvVehicles.userId, activeId)
        });

        if (!rv) return { success: false, error: "RV Profile not found" };

        const data = await db.query.financialData.findFirst({
            where: eq(financialData.rvId, rv.id)
        });

        return { success: true, data };
    } catch (error) {
        return { success: false, error: "Failed to fetch financial data" };
    }
}

export async function updateFinancialData(values: any) {
    try {
        const { userId } = await auth();
        if (userId === "demo_user") {
            return { error: "Guest Mode is Read-Only! Cannot save calculations." };
        }
        const activeId = userId || "demo_user";

        const rv = await db.query.rvVehicles.findFirst({
            where: eq(rvVehicles.userId, activeId)
        });

        if (!rv) return { error: "RV Profile not found" };

        const existing = await db.query.financialData.findFirst({
            where: eq(financialData.rvId, rv.id)
        });

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

        if (existing) {
            await db.update(financialData)
                .set({ ...numValues, updatedAt: new Date() })
                .where(eq(financialData.id, existing.id));
        } else {
            await db.insert(financialData).values({
                id: Date.now().toString(),
                rvId: rv.id,
                ...numValues
            });
        }
        revalidatePath('/calculators/purchase');
        return { success: true };
    } catch (error: any) {
        return { error: error.message || "Failed to save financial data" };
    }
}
