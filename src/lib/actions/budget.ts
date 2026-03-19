'use server';

import { db } from '../db';
import { expenses, financialData, targetBudgets } from "../db/schema";
import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto';
import { getActiveUserId, requireAuth } from './auth-helpers';

export async function getTargetBudgets(year: number) {
    const activeId = await getActiveUserId();
    const res = await db.select().from(targetBudgets).where(and(eq(targetBudgets.userId, activeId), eq(targetBudgets.year, year)));
    return res;
}

export async function setTargetBudget(month: number, year: number, amount: number) {
    const activeId = await requireAuth();

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
            id: randomUUID(),
            userId: activeId,
            month,
            year,
            amount: String(amount)
        });
    }
    return true;
}

export async function getExpenses(year?: number) {
    const activeId = await getActiveUserId();

    const query = db.select().from(expenses);

    if (year) {
        return await query.where(and(eq(expenses.userId, activeId), eq(expenses.year, year)));
    }
    return await query.where(eq(expenses.userId, activeId));
}

export async function addExpense(data: { name: string, category: string, amount: number, isFixed: boolean, month: number, year: number, group: string, costPerItem: number, quantity: number, tax: number, gallons?: number, odometerReading?: number, isFuelEvent?: boolean, isPropaneEvent?: boolean }) {
    const activeId = await requireAuth();

    const id = randomUUID();
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
    const activeId = await requireAuth();

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
    const activeId = await requireAuth();

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
    await requireAuth();

    await db.delete(expenses).where(eq(expenses.id, id));
    revalidatePath('/calculators/budget');
}
