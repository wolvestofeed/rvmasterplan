'use server';

import { db } from '../db';
import { expenses, financialData, targetBudgets } from "../db/schema";
import { and, eq } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';

export async function getTargetBudgets(year: number) {
    const { userId } = await auth();
    const activeId = userId || "demo_user";
    console.log(`[DEBUG TARGET BUD] User: ${activeId}, Year: ${year}`);

    const res = await db.select().from(targetBudgets).where(and(eq(targetBudgets.userId, activeId), eq(targetBudgets.year, year)));
    console.log(`[DEBUG TARGET BUD] Result Length: ${res.length}`);
    return res;
}

export async function setTargetBudget(month: number, year: number, amount: number) {
    const { userId } = await auth();
    const activeId = userId || "demo_user";
    if (!userId || activeId === "demo_user") throw new Error("Saving is disabled in Demo Mode.");

    const existing = await db.select().from(targetBudgets).where(
        and(
            eq(targetBudgets.userId, activeId),
            eq(targetBudgets.month, month),
            eq(targetBudgets.year, year)
        )
    );

    if (existing.length > 0) {
        await db.update(targetBudgets).set({ amount: String(amount) }).where(eq(targetBudgets.id, existing[0].id));
    } else {
        await db.insert(targetBudgets).values({
            id: Date.now().toString() + "-" + month,
            userId: activeId,
            month,
            year,
            amount: String(amount)
        });
    }
    return true;
}

export async function getExpenses(year?: number) {
    const { userId } = await auth();
    const activeId = userId || "demo_user";

    const query = db.select().from(expenses);

    if (year) {
        return await query.where(and(eq(expenses.userId, activeId), eq(expenses.year, year)));
    }
    return await query.where(eq(expenses.userId, activeId));
}

export async function addExpense(data: { name: string, category: string, amount: number, isFixed: boolean, month: number, year: number, group: string, costPerItem: number, quantity: number, tax: number, gallons?: number, odometerReading?: number, isFuelEvent?: boolean, isPropaneEvent?: boolean }) {
    const { userId } = await auth();
    const activeId = userId || "demo_user";
    if (!userId || activeId === "demo_user") throw new Error("Saving is disabled in Demo Mode.");

    const id = Date.now().toString();
    await db.insert(expenses).values({
        id,
        userId: activeId,
        name: data.name,
        category: data.category,
        amount: String(data.amount),
        month: data.month,
        year: data.year,
        isFixed: data.isFixed,
        gallons: data.gallons ? String(data.gallons) : null,
        odometerReading: data.odometerReading || null,
        isFuelEvent: data.isFuelEvent || false,
        isPropaneEvent: data.isPropaneEvent || false
    });

    revalidatePath('/calculators/budget');
    return id;
}

export async function updateExpense(id: string, data: { name: string, category: string, amount: number, isFixed: boolean, month: number, year: number, group: string, costPerItem: number, quantity: number, tax: number, gallons?: number, odometerReading?: number, isFuelEvent?: boolean, isPropaneEvent?: boolean }) {
    const { userId } = await auth();
    const activeId = userId || "demo_user";
    if (!userId || activeId === "demo_user") throw new Error("Saving is disabled in Demo Mode.");

    await db.update(expenses).set({
        name: data.name,
        category: data.category,
        amount: String(data.amount),
        month: data.month,
        year: data.year,
        isFixed: data.isFixed,
        gallons: data.gallons ? String(data.gallons) : null,
        odometerReading: data.odometerReading || null,
        isFuelEvent: data.isFuelEvent || false,
        isPropaneEvent: data.isPropaneEvent || false
    }).where(and(eq(expenses.id, id), eq(expenses.userId, activeId)));

    revalidatePath('/calculators/budget');
    return true;
}

export async function batchAddExpenses(expensesList: any[]) {
    const { userId } = await auth();
    const activeId = userId || "demo_user";
    if (!userId || activeId === "demo_user") throw new Error("Saving is disabled in Demo Mode.");

    if (expensesList.length === 0) return true;

    const insertData = expensesList.map(e => ({
        id: e.id,
        userId: activeId,
        name: e.name,
        category: e.category,
        amount: String(e.costPerItem),
        month: e.month,
        year: e.year,
        isFixed: e.isFixed || false
    }));

    await db.insert(expenses).values(insertData);
    revalidatePath('/calculators/budget');
    return true;
}

export async function deleteExpense(id: string) {
    const { userId } = await auth();
    if (!userId || userId === "demo_user") throw new Error("Saving is disabled in Demo Mode.");

    await db.delete(expenses).where(eq(expenses.id, id));
    revalidatePath('/calculators/budget');
}
