'use server';

import { db } from '../db';
import { incomes, expenses } from '../db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';

export async function getIncomes() {
    const { userId } = await auth();
    if (!userId) return [];

    return await db.select().from(incomes).where(eq(incomes.userId, userId));
}

export async function addIncome(data: { source: string, amount: number, isFixed: boolean }) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const id = Date.now().toString();
    await db.insert(incomes).values({
        id,
        userId,
        ...data,
        amount: String(data.amount)
    });

    revalidatePath('/calculators/budget');
    return id;
}

export async function deleteIncome(id: string) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    await db.delete(incomes).where(eq(incomes.id, id));
    revalidatePath('/calculators/budget');
}

export async function getExpenses() {
    const { userId } = await auth();
    if (!userId) return [];

    return await db.select().from(expenses).where(eq(expenses.userId, userId));
}

export async function addExpense(data: { name: string, category: string, amount: number, isFixed: boolean }) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const id = Date.now().toString();
    await db.insert(expenses).values({
        id,
        userId,
        ...data,
        amount: String(data.amount)
    });

    revalidatePath('/calculators/budget');
    return id;
}

export async function deleteExpense(id: string) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    await db.delete(expenses).where(eq(expenses.id, id));
    revalidatePath('/calculators/budget');
}
